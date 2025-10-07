import type { TestingModule } from "@nestjs/testing";
import type { Connection, Model as MongooseModel } from "mongoose";
import type { TemplateDraftDbProps } from "../domain/template-draft";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule } from "@open-dpp/env";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { MongooseTestingModule } from "@open-dpp/testing";
import { DataFieldType } from "../../data-modelling/domain/data-field-base";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { SectionType } from "../../data-modelling/domain/section-base";
import { TemplateDocSchemaVersion } from "../../templates/infrastructure/template.schema";
import { DataFieldDraft } from "../domain/data-field-draft";
import { SectionDraft } from "../domain/section-draft";
import { TemplateDraft } from "../domain/template-draft";
import { sectionDraftDbPropsFactory } from "../fixtures/section-draft.factory";
import {
  templateDraftCreatePropsFactory,
  templateDraftDbFactory,
} from "../fixtures/template-draft.factory";
import { TemplateDraftDoc, TemplateDraftSchema } from "./template-draft.schema";
import { TemplateDraftService } from "./template-draft.service";

describe("templateDraftService", () => {
  let service: TemplateDraftService;
  let mongoConnection: Connection;
  let module: TestingModule;
  let templateDraftDoc: MongooseModel<TemplateDraftDoc>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: TemplateDraftDoc.name,
            schema: TemplateDraftSchema,
          },
        ]),
      ],
      providers: [TemplateDraftService],
    }).compile();
    service = module.get<TemplateDraftService>(TemplateDraftService);
    mongoConnection = module.get<Connection>(getConnectionToken());
    templateDraftDoc = mongoConnection.model(
      TemplateDraftDoc.name,
      TemplateDraftSchema,
    );
  });

  const laptopModelPlain: TemplateDraftDbProps = templateDraftDbFactory.build({
    publications: [
      {
        id: randomUUID(),
        version: "1.0.0",
      },
      {
        id: randomUUID(),
        version: "2.0.0",
      },
    ],
  });

  it("saves draft", async () => {
    const templateDraft = TemplateDraft.loadFromDb({
      ...laptopModelPlain,
    });
    const { id } = await service.save(templateDraft);
    const found = await service.findOneOrFail(id);
    expect(found).toEqual(templateDraft);
  });

  it("fails if requested template draft could not be found", async () => {
    await expect(service.findOneOrFail(randomUUID())).rejects.toThrow(
      new NotFoundInDatabaseException(TemplateDraft.name),
    );
  });

  it("sets correct default granularity level", async () => {
    const laptopModel: TemplateDraftDbProps = templateDraftDbFactory.build({
      sections: [
        sectionDraftDbPropsFactory.build({
          id: "s1",
          type: SectionType.GROUP,
          granularityLevel: undefined,
        }),
        sectionDraftDbPropsFactory.build({
          id: "s2",
          type: SectionType.REPEATABLE,
        }),
      ],
    });

    const templateDraft = TemplateDraft.loadFromDb({
      ...laptopModel,
      organizationId: randomUUID(),
      userId: randomUUID(),
    });
    const { id } = await service.save(templateDraft);
    const found = await service.findOneOrFail(id);
    expect(found.findSectionOrFail("s1").granularityLevel).toBeUndefined();
    expect(found.findSectionOrFail("s2").granularityLevel).toEqual(
      GranularityLevel.MODEL,
    );
  });

  it("should delete section on template draft", async () => {
    const templateDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build(),
    );
    const section1 = SectionDraft.create({
      name: "Technical Specs",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.ITEM,
    });
    const section11 = SectionDraft.create({
      name: "Dimensions",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.ITEM,
    });
    const section2 = SectionDraft.create({
      name: "Traceability",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.ITEM,
    });
    templateDraft.addSection(section1);
    templateDraft.addSubSection(section1.id, section11);
    templateDraft.addSection(section2);
    const dataField = DataFieldDraft.create({
      name: "Processor",
      type: DataFieldType.TEXT_FIELD,
      granularityLevel: GranularityLevel.ITEM,
    });
    templateDraft.addDataFieldToSection(section1.id, dataField);

    await service.save(templateDraft);
    templateDraft.deleteSection(section1.id);
    const { id } = await service.save(templateDraft);
    const found = await service.findOneOrFail(id);
    expect(found.sections).toEqual([section2]);
  });

  it("should delete data fields of template draft", async () => {
    const templateDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build(),
    );
    const section = SectionDraft.create({
      name: "Tech specs",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    templateDraft.addSection(section);
    const dataField1 = DataFieldDraft.create({
      name: "Processor",
      type: DataFieldType.TEXT_FIELD,
      granularityLevel: GranularityLevel.MODEL,
    });
    const dataField2 = DataFieldDraft.create({
      name: "Memory",
      type: DataFieldType.TEXT_FIELD,
      granularityLevel: GranularityLevel.MODEL,
    });

    templateDraft.addDataFieldToSection(section.id, dataField1);
    templateDraft.addDataFieldToSection(section.id, dataField2);
    await service.save(templateDraft);
    templateDraft.deleteDataFieldOfSection(section.id, dataField2.id);
    await service.save(templateDraft);
    const found = await service.findOneOrFail(templateDraft.id);
    expect(found.sections[0].dataFields).toEqual([dataField1]);
  });

  it("should return all template drafts by organization", async () => {
    const organizationId = randomUUID();

    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        name: "laptop",
        organizationId,
      }),
    );
    const phoneDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        name: "phone",
        organizationId,
      }),
    );
    await service.save(laptopDraft);
    await service.save(phoneDraft);
    const otherOrganizationId = randomUUID();

    await service.save(
      TemplateDraft.create(
        templateDraftCreatePropsFactory.build({
          organizationId: otherOrganizationId,
        }),
      ),
    );
    const foundAll = await service.findAllByOrganization(organizationId);
    expect(foundAll).toEqual([
      { id: laptopDraft.id, name: laptopDraft.name },
      { id: phoneDraft.id, name: phoneDraft.name },
    ]);
  });

  it(`should migrate from smaller equal ${TemplateDocSchemaVersion.v1_0_2} to ${TemplateDocSchemaVersion.v1_0_3}`, async () => {
    const id = randomUUID();
    await templateDraftDoc.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          _schemaVersion: TemplateDocSchemaVersion.v1_0_2,
          name: "name",
          version: "1.0.0",
          createdByUserId: randomUUID(),
          ownedByOrganizationId: randomUUID(),
          sections: [
            {
              _id: randomUUID(),
              name: "s1",
              type: SectionType.GROUP,
              layout: {
                colSpan: {
                  sm: 1,
                },
                colStart: {
                  sm: 1,
                },
                rowStart: {
                  sm: 1,
                },
                rowSpan: {
                  sm: 1,
                },
                cols: {
                  sm: 1,
                },
              },
              dataFields: [
                {
                  _id: randomUUID(),
                  name: "f1",
                  type: DataFieldType.TEXT_FIELD,
                  granularityLevel: GranularityLevel.MODEL,
                  layout: {
                    colSpan: {
                      sm: 1,
                    },
                    colStart: {
                      sm: 1,
                    },
                    rowStart: {
                      sm: 1,
                    },
                    rowSpan: {
                      sm: 1,
                    },
                  },
                },
              ],
              subSections: [],
            },
          ],
        },
      },
      { upsert: true },
    );
    let foundRaw = await templateDraftDoc.findById(id);
    expect(foundRaw).toBeDefined();
    if (foundRaw) {
      expect(foundRaw.sections[0].layout).toBeDefined();
      expect(foundRaw.sections[0].dataFields[0].layout).toBeDefined();
      const found = await service.findOneOrFail(id);
      const saved = await service.save(found);
      foundRaw = await templateDraftDoc.findById(saved.id);
      expect(foundRaw).toBeDefined();
      if (foundRaw) {
        expect(foundRaw._schemaVersion).toEqual(
          TemplateDocSchemaVersion.v1_0_3,
        );
        expect(foundRaw.sections[0].layout).toBeUndefined();
        expect(foundRaw.sections[0].dataFields[0].layout).toBeUndefined();
      }
    }
  });

  afterAll(async () => {
    await mongoConnection.close(); // Close connection after tests
    await module.close();
  });
});
