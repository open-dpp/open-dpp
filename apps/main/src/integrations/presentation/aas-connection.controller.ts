import type * as authRequest from "@open-dpp/auth";
import type {
  AssetAdministrationShellType_TYPE,
} from "../domain/asset-administration-shell";
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Request,
} from "@nestjs/common";
import { Public } from "@open-dpp/auth";
import { EnvService } from "@open-dpp/env";
import { hasPermission, PermissionAction } from "@open-dpp/permission";
import { ItemsService } from "../../items/infrastructure/items.service";
import { itemToDto } from "../../items/presentation/dto/item.dto";
import { ItemsApplicationService } from "../../items/presentation/items-application.service";
import { ModelsService } from "../../models/infrastructure/models.service";
import { OrganizationsService } from "../../organizations/infrastructure/organizations.service";
import { TemplateService } from "../../templates/infrastructure/template.service";
import { UniqueProductIdentifierService } from "../../unique-product-identifier/infrastructure/unique-product-identifier.service";
import { User } from "../../users/domain/user";
import { AasConnection } from "../domain/aas-connection";
import {
  AssetAdministrationShell,
  createAasForType,
} from "../domain/asset-administration-shell";
import { AasConnectionService } from "../infrastructure/aas-connection.service";
import { aasConnectionToDto } from "./dto/aas-connection.dto";
import * as createAasConnectionDto from "./dto/create-aas-connection.dto";
import { GetAasConnectionCollectionSchema } from "./dto/get-aas-connection-collection.dto";
import * as updateAasConnectionDto from "./dto/update-aas-connection.dto";

@Controller("organizations/:orgaId/integration/aas")
export class AasConnectionController {
  private readonly modelsService: ModelsService;
  private readonly itemService: ItemsService;
  private readonly organizationsService: OrganizationsService;
  private readonly itemsApplicationService: ItemsApplicationService;
  private aasConnectionService: AasConnectionService;
  private templateService: TemplateService;
  private configService: EnvService;
  private uniqueProductIdentifierService: UniqueProductIdentifierService;

  constructor(
    modelsService: ModelsService,
    itemService: ItemsService,
    organizationsService: OrganizationsService,
    itemsApplicationService: ItemsApplicationService,
    aasConnectionService: AasConnectionService,
    templateService: TemplateService,
    configService: EnvService,
    uniqueProductIdentifierService: UniqueProductIdentifierService,
  ) {
    this.modelsService = modelsService;
    this.itemService = itemService;
    this.organizationsService = organizationsService;
    this.itemsApplicationService = itemsApplicationService;
    this.aasConnectionService = aasConnectionService;
    this.templateService = templateService;
    this.configService = configService;
    this.uniqueProductIdentifierService = uniqueProductIdentifierService;
  }

  @Public()
  @Post("/connections/:connectionId/items/")
  async upsertItem(
    @Headers("API_TOKEN") apiToken: string,
    @Param("orgaId") organizationId: string,
    @Param("connectionId") connectionId: string,
    @Body() aasJson: any,
  ) {
    if (apiToken !== this.configService.get("OPEN_DPP_AAS_TOKEN")) {
      throw new ForbiddenException("Wrong api token");
    }
    const aasConnection
      = await this.aasConnectionService.findById(connectionId);

    if (!aasConnection.isOwnedBy(organizationId)) {
      throw new ForbiddenException();
    }
    if (!aasConnection.modelId) {
      throw new ForbiddenException();
    }
    const assetAdministrationShell = AssetAdministrationShell.create({
      content: aasJson,
    });

    const uniqueProductIdentifier
      = await this.uniqueProductIdentifierService.findOne(
        assetAdministrationShell.globalAssetId,
      );

    const organization
      = await this.organizationsService.findOneOrFail(organizationId);

    const item = uniqueProductIdentifier
      ? await this.itemService.findOneOrFail(
          uniqueProductIdentifier.referenceId,
        )
      : await this.itemsApplicationService.createItem(
          organizationId,
          aasConnection.modelId,
          organization.createdByUserId,
          assetAdministrationShell.globalAssetId,
        );

    const productDataModel = await this.templateService.findOneOrFail(
      aasConnection.dataModelId,
    );

    const dataValues = aasConnection.generateDataValues(
      assetAdministrationShell,
      productDataModel,
    );
    item.modifyDataValues(dataValues);
    return itemToDto(await this.itemService.save(item));
  }

  @Post("/connections")
  async createConnection(
    @Param("orgaId") organizationId: string,
    @Body() body: createAasConnectionDto.CreateAasConnectionDto,
    @Request() req: authRequest.AuthRequest,
  ) {
    const createAasMapping
      = createAasConnectionDto.CreateAasConnectionSchema.parse(body);
    const organization = await this.organizationsService.findOneOrFail(organizationId);
    if (!hasPermission({
      user: {
        id: (req.authContext.user as User).id,
      },
    }, PermissionAction.READ, organization.toPermissionSubject())) {
      throw new ForbiddenException();
    }
    if (!createAasMapping.modelId) {
      throw new ForbiddenException();
    }
    const model = await this.modelsService.findOneOrFail(
      createAasMapping.modelId,
    );
    const productDataModel = await this.templateService.findOneOrFail(
      createAasMapping.dataModelId,
    );
    const aasConnection = AasConnection.create({
      name: createAasMapping.name,
      organizationId,
      userId: req.authContext.keycloakUser.sub,
      dataModelId: productDataModel.id,
      aasType: createAasMapping.aasType,
      modelId: model.id,
    });
    for (const fieldMapping of createAasMapping.fieldAssignments) {
      aasConnection.addFieldAssignment(fieldMapping);
    }
    await this.aasConnectionService.save(aasConnection);
    return aasConnectionToDto(aasConnection);
  }

  @Patch("/connections/:connectionId")
  async updateConnection(
    @Param("orgaId") organizationId: string,
    @Param("connectionId") connectionId: string,
    @Body() body: updateAasConnectionDto.UpdateAasConnectionDto,
    @Request() req: authRequest.AuthRequest,
  ) {
    const updateAasConnection
      = updateAasConnectionDto.UpdateAasConnectionSchema.parse(body);
    const organization = await this.organizationsService.findOneOrFail(organizationId);
    if (!hasPermission({
      user: {
        id: (req.authContext.user as User).id,
      },
    }, PermissionAction.READ, organization.toPermissionSubject())) {
      throw new ForbiddenException();
    }

    const aasConnection
      = await this.aasConnectionService.findById(connectionId);
    if (!aasConnection.isOwnedBy(organizationId)) {
      throw new ForbiddenException();
    }
    aasConnection.rename(updateAasConnection.name);

    if (updateAasConnection.modelId !== null) {
      const model = await this.modelsService.findOneOrFail(
        updateAasConnection.modelId,
      );
      if (!model.isOwnedBy(organizationId)) {
        throw new ForbiddenException();
      }

      aasConnection.assignModel(model);
    }
    aasConnection.replaceFieldAssignments(updateAasConnection.fieldAssignments);
    await this.aasConnectionService.save(aasConnection);
    return aasConnectionToDto(aasConnection);
  }

  @Get("/connections/:connectionId")
  async findConnection(
    @Param("orgaId") organizationId: string,
    @Param("connectionId") connectionId: string,
    @Request() req: authRequest.AuthRequest,
  ) {
    const organization = await this.organizationsService.findOneOrFail(organizationId);
    if (!hasPermission({
      user: {
        id: (req.authContext.user as User).id,
      },
    }, PermissionAction.READ, organization.toPermissionSubject())) {
      throw new ForbiddenException();
    }
    const aasConnection
      = await this.aasConnectionService.findById(connectionId);
    if (!aasConnection.isOwnedBy(organizationId)) {
      throw new ForbiddenException();
    }
    return aasConnectionToDto(aasConnection);
  }

  @Get("/connections")
  async findAllConnectionsOfOrganization(
    @Param("orgaId") organizationId: string,
    @Request() req: authRequest.AuthRequest,
  ) {
    const organization = await this.organizationsService.findOneOrFail(organizationId);
    if (!hasPermission({
      user: {
        id: (req.authContext.user as User).id,
      },
    }, PermissionAction.READ, organization.toPermissionSubject())) {
      throw new ForbiddenException();
    }
    const aasConnections
      = await this.aasConnectionService.findAllByOrganization(organizationId);
    return GetAasConnectionCollectionSchema.parse(aasConnections);
  }

  @Get(":aasType/properties")
  async getProperties(
    @Param("orgaId") organizationId: string,
    @Param("aasType") aasType: AssetAdministrationShellType_TYPE,
    @Request() req: authRequest.AuthRequest,
  ) {
    const organization = await this.organizationsService.findOneOrFail(organizationId);
    if (!hasPermission({
      user: {
        id: (req.authContext.user as User).id,
      },
    }, PermissionAction.READ, organization.toPermissionSubject())) {
      throw new ForbiddenException();
    }
    const assetAdministrationShell = createAasForType(aasType);
    return assetAdministrationShell.propertiesWithParent;
  }
}
