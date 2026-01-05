import { randomUUID } from 'node:crypto'
import { SubmodelElementSchema } from '@open-dpp/dto'
import { submodelCarbonFootprintPlainFactory } from '@open-dpp/testing'
import {
  AssetAdministrationShellType,
  DataFieldType,
  GranularityLevel,
  MoveDirection,
  MoveType,
  OpenDppClient,
  Sector,
  VisibilityLevel,
} from '../../src'
import { activeOrganization, organizations } from '../organization'
import {
  aasResponse,
  aasWrapperId,
  paginationParams,
  propertyToAdd,
  submodelCarbonFootprintElement0,
  submodelCarbonFootprintResponse,
  submodelDesignOfProduct,
  submodelDesignOfProductElement0,
  submodelValueResponse,
} from './handlers/aas'
import { aasPropertiesWithParent, connection, connectionList } from './handlers/aas-integration'
import { item1, item2 } from './handlers/item'
import { mediaReferences, mediaReferenceUpdate, model, responseDataValues, updateDataValues } from './handlers/model'
import { oldTemplate } from './handlers/old-template'
import { productPassport } from './handlers/product-passport'
import { dataFieldDraft, draftsOfOrganization, sectionDraft, templateDraft } from './handlers/template-draft'
import { template1, template2 } from './handlers/templates'
import {
  uniqueProductIdentifierId,
  uniqueProductIdentifierMetadata,
  uniqueProductIdentifierReference,
} from './handlers/unique-product-identifiers'
import { server } from './msw.server'

describe('apiClient', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
  const baseURL = 'https://api.cloud.open-dpp.de'

  describe('organizations', () => {
    it('should return organizations', async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      })
      const response = await sdk.dpp.organizations.getAll()
      expect(response.data).toEqual(organizations)
    })
  })

  describe('old templates', () => {
    const sdk = new OpenDppClient({
      dpp: { baseURL },
    })
    sdk.setActiveOrganizationId(activeOrganization.id)
    it('should get all templates', async () => {
      const response = await sdk.dpp.oldTemplates.getAll()
      expect(response.data).toEqual([{ id: oldTemplate.id, name: oldTemplate.name }])
    })

    it('should get template by id', async () => {
      const response = await sdk.dpp.oldTemplates.getById(oldTemplate.id)
      expect(response.data).toEqual(oldTemplate)
    })
  })

  describe('templates', () => {
    const sdk = new OpenDppClient({
      dpp: { baseURL },
    })
    sdk.setActiveOrganizationId(activeOrganization.id)
    it('should get all templates', async () => {
      const response = await sdk.dpp.templates.getAll(paginationParams)
      expect(response.data.result).toEqual([template1, template2])
    })

    it('should create template', async () => {
      const response = await sdk.dpp.templates.create()
      expect(response.data).toEqual(template1)
    })
  })

  describe.each(['templates'])('aas', () => {
    const sdk = new OpenDppClient({
      dpp: { baseURL },
    })
    it('should return shells', async () => {
      const response = await sdk.dpp.templates.aas.getShells(aasWrapperId, paginationParams)
      expect(response.data.paging_metadata.cursor).toEqual(aasResponse.id)
      expect(response.data.result).toEqual([aasResponse])
    })
    it('should return submodels', async () => {
      const response = await sdk.dpp.templates.aas.getSubmodels(aasWrapperId, paginationParams)
      expect(response.data).toEqual([submodelCarbonFootprintResponse])
    })
    it('should return submodel by id', async () => {
      const response = await sdk.dpp.templates.aas.getSubmodelById(aasWrapperId, btoa(submodelCarbonFootprintResponse.id))
      expect(response.data).toEqual(submodelCarbonFootprintResponse)
    })
    it('should return submodel as value', async () => {
      const response = await sdk.dpp.templates.aas.getSubmodelValue(aasWrapperId, btoa(submodelDesignOfProduct.id))
      expect(response.data).toEqual(submodelValueResponse)
    })
    it('should return submodel elements of submodel', async () => {
      const response = await sdk.dpp.templates.aas.getSubmodelElements(aasWrapperId, btoa(submodelCarbonFootprintResponse.id))
      expect(response.data).toEqual(submodelCarbonFootprintResponse.submodelElements)
    })

    it('should return submodel element by id', async () => {
      const response = await sdk.dpp.templates.aas.getSubmodelElementById(aasWrapperId, btoa(submodelCarbonFootprintResponse.id), submodelCarbonFootprintElement0.idShort)
      expect(response.data).toEqual(submodelCarbonFootprintResponse.submodelElements[0])
    })

    it('should return submodel element value', async () => {
      const response = await sdk.dpp.templates.aas.getSubmodelElementValue(aasWrapperId, btoa(submodelDesignOfProduct.id), submodelDesignOfProductElement0.idShort)
      expect(response.data).toEqual(submodelValueResponse.Design_V01)
    })

    it('should create submodel', async () => {
      const response = await sdk.dpp.templates.aas.createSubmodel(aasWrapperId, submodelCarbonFootprintPlainFactory.build())
      expect(response.data).toEqual(submodelCarbonFootprintResponse)
    })

    it('should create submodel element', async () => {
      const response = await sdk.dpp.templates.aas.createSubmodelElement(aasWrapperId, btoa(submodelCarbonFootprintResponse.id), propertyToAdd)
      expect(response.data).toEqual(SubmodelElementSchema.parse(propertyToAdd))
    })

    it('should create submodel element at idShortPath', async () => {
      const response = await sdk.dpp.templates.aas.createSubmodelElementAtIdShortPath(
        aasWrapperId,
        btoa(submodelCarbonFootprintResponse.id),
        submodelCarbonFootprintElement0.idShort,
        propertyToAdd,
      )
      expect(response.data).toEqual(SubmodelElementSchema.parse(propertyToAdd))
    })
  })

  describe('model', () => {
    it('should create model', async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      })
      sdk.setActiveOrganizationId(activeOrganization.id)
      const response = await sdk.dpp.models.create({
        name: 'model test',
        description: 'description test',
        templateId: randomUUID(),
      })
      expect(response.data).toEqual(model)
    })
    it('should return model', async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      })
      sdk.setActiveOrganizationId(activeOrganization.id)
      const response = await sdk.dpp.models.getById(model.id)
      expect(response.data).toEqual(model)
    })

    it('should update model data', async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      })
      sdk.setActiveOrganizationId(activeOrganization.id)

      const response = await sdk.dpp.models.modifyData(
        model.id,
        updateDataValues,
      )
      expect(response.data.dataValues).toEqual(responseDataValues)
    })

    it('should add model data', async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      })
      sdk.setActiveOrganizationId(activeOrganization.id)

      const addDataValues = [
        {
          dataFieldId: randomUUID(),
          dataSectionId: randomUUID(),
          row: 0,
          value: 'A',
        },
        {
          dataFieldId: randomUUID(),
          dataSectionId: randomUUID(),
          row: 0,
          value: 'B',
        },
      ]
      const response = await sdk.dpp.models.addData(model.id, addDataValues)
      expect(response.data.dataValues).toEqual(
        addDataValues.map(v => ({ ...v })),
      )
    })

    it('should add media reference', async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      })
      sdk.setActiveOrganizationId(activeOrganization.id)

      const response = await sdk.dpp.models.addMediaReference(model.id, mediaReferences[0])
      expect(response.data.mediaReferences).toEqual(
        [mediaReferences[0].id],
      )
    })

    it('should delete media reference', async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      })
      sdk.setActiveOrganizationId(activeOrganization.id)

      const response = await sdk.dpp.models.deleteMediaReference(model.id, mediaReferences[0].id)
      expect(response.data.mediaReferences).toEqual(
        [],
      )
    })

    it('should modify media reference', async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      })
      sdk.setActiveOrganizationId(activeOrganization.id)

      const response = await sdk.dpp.models.modifyMediaReference(model.id, mediaReferences[0].id, mediaReferenceUpdate)
      expect(response.data.mediaReferences).toEqual(
        [mediaReferenceUpdate.id],
      )
    })

    it('should move media reference to another position', async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      })
      sdk.setActiveOrganizationId(activeOrganization.id)

      const response = await sdk.dpp.models.moveMediaReference(model.id, mediaReferences[0].id, { position: 0 })
      expect(response.data.mediaReferences).toEqual(
        [mediaReferences[0].id],
      )
    })
  })

  describe('items', () => {
    it('should create item', async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      })
      sdk.setActiveOrganizationId(activeOrganization.id)

      const response = await sdk.dpp.items.create(model.id)
      expect(response.data).toEqual(item1)
    })

    it('should get items', async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      })
      sdk.setActiveOrganizationId(activeOrganization.id)

      const response = await sdk.dpp.items.getAll(model.id)
      expect(response.data).toEqual([item1, item2])
    })

    it('should get single item', async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      })
      sdk.setActiveOrganizationId(activeOrganization.id)

      const response = await sdk.dpp.items.getById(model.id, item1.id)
      expect(response.data).toEqual(item1)
    })

    it('should update item data', async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      })
      sdk.setActiveOrganizationId(activeOrganization.id)

      const response = await sdk.dpp.items.modifyData(
        model.id,
        item1.id,
        updateDataValues,
      )
      expect(response.data.dataValues).toEqual(responseDataValues)
    })

    it('should add item data', async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      })
      sdk.setActiveOrganizationId(activeOrganization.id)

      const addDataValues = [
        {
          dataFieldId: randomUUID(),
          dataSectionId: randomUUID(),
          row: 0,
          value: 'A',
        },
        {
          dataFieldId: randomUUID(),
          dataSectionId: randomUUID(),
          row: 0,
          value: 'B',
        },
      ]
      const response = await sdk.dpp.items.addData(
        model.id,
        item1.id,
        addDataValues,
      )
      expect(response.data.dataValues).toEqual(
        addDataValues.map(v => ({ ...v })),
      )
    })
  })

  describe('template-drafts', () => {
    const sdk = new OpenDppClient({
      dpp: { baseURL },
    })
    sdk.setActiveOrganizationId(activeOrganization.id)
    it('should be created', async () => {
      const response = await sdk.dpp.templateDrafts.create({
        name: templateDraft.name,
        description: templateDraft.description,
        sectors: templateDraft.sectors,
      })
      expect(response.data).toEqual({
        ...templateDraft,
      })
    })
    it('should add section to draft', async () => {
      const response = await sdk.dpp.templateDrafts.addSection(
        templateDraft.id,
        {
          name: sectionDraft.name,
          type: sectionDraft.type,
          parentSectionId: randomUUID(),
        },
      )
      expect(response.data).toEqual({
        ...templateDraft,
      })
    })
    it('should add data field to section of draft', async () => {
      const response = await sdk.dpp.templateDrafts.addDataField(
        templateDraft.id,
        sectionDraft.id,
        {
          name: dataFieldDraft.name,
          type: dataFieldDraft.type,
          options: { max: 2 },
          granularityLevel: GranularityLevel.MODEL,
        },
      )
      expect(response.data).toEqual({
        ...templateDraft,
      })
    })

    it('should modify data field', async () => {
      const response = await sdk.dpp.templateDrafts.modifyDataField(
        templateDraft.id,
        sectionDraft.id,
        dataFieldDraft.id,
        {
          name: 'new name',
          type: DataFieldType.NUMERIC_FIELD,
          options: { min: 2 },
        },
      )
      expect(response.data).toEqual({
        ...templateDraft,
      })
    })

    it('should delete data field', async () => {
      const response = await sdk.dpp.templateDrafts.deleteDataField(
        templateDraft.id,
        sectionDraft.id,
        dataFieldDraft.id,
      )
      expect(response.data).toEqual({
        ...templateDraft,
      })
    })

    it('should delete section', async () => {
      const response = await sdk.dpp.templateDrafts.deleteSection(
        templateDraft.id,
        sectionDraft.id,
      )
      expect(response.data).toEqual({
        ...templateDraft,
      })
    })

    it('should modify section', async () => {
      const response = await sdk.dpp.templateDrafts.modifySection(
        templateDraft.id,
        sectionDraft.id,
        {
          name: 'new name',
        },
      )
      expect(response.data).toEqual({
        ...templateDraft,
      })
    })

    it('should move section', async () => {
      const response = await sdk.dpp.templateDrafts.moveSection(
        templateDraft.id,
        sectionDraft.id,
        {
          type: MoveType.POSITION,
          direction: MoveDirection.DOWN,
        },
      )
      expect(response.data).toEqual({
        ...templateDraft,
      })
    })

    it('should move data field', async () => {
      const response = await sdk.dpp.templateDrafts.moveDataField(
        templateDraft.id,
        sectionDraft.id,
        dataFieldDraft.id,
        {
          type: MoveType.POSITION,
          direction: MoveDirection.DOWN,
        },
      )
      expect(response.data).toEqual({
        ...templateDraft,
      })
    })

    it('should get all template drafts', async () => {
      const response = await sdk.dpp.templateDrafts.getAll()
      expect(response.data).toEqual(draftsOfOrganization)
    })

    it('should get template draft', async () => {
      const response = await sdk.dpp.templateDrafts.getById(templateDraft.id)
      expect(response.data).toEqual({ ...templateDraft })
    })

    it('should modify template draft', async () => {
      const response = await sdk.dpp.templateDrafts.modify(templateDraft.id, {
        name: 'new Name',
        description: 'new Description',
        sectors: [Sector.CONSTRUCTION],
      })
      expect(response.data).toEqual({ ...templateDraft })
    })

    it('should be published', async () => {
      const response = await sdk.dpp.templateDrafts.publish(templateDraft.id, {
        visibility: VisibilityLevel.PRIVATE,
      })
      expect(response.data).toEqual({ ...oldTemplate })
    })
  })

  describe('unique-product-identifiers', () => {
    it('should return reference of unique product identifier', async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      })
      sdk.setActiveOrganizationId(activeOrganization.id)
      const response = await sdk.dpp.uniqueProductIdentifiers.getReference(
        uniqueProductIdentifierId,
      )
      expect(response.data).toEqual(uniqueProductIdentifierReference)
    })

    it('should get metadata of unique product identifier', async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      })
      sdk.setActiveOrganizationId(activeOrganization.id)
      const response = await sdk.dpp.uniqueProductIdentifiers.getMetadata(
        uniqueProductIdentifierId,
      )
      expect(response.data).toEqual(uniqueProductIdentifierMetadata)
    })
  })

  describe('product-passports', () => {
    const sdk = new OpenDppClient({
      dpp: { baseURL },
    })
    sdk.setActiveOrganizationId(activeOrganization.id)
    it('should returned', async () => {
      const response = await sdk.dpp.productPassports.getById(
        productPassport.id,
      )
      expect(response.data).toEqual({
        ...productPassport,
      })
    })
  })

  describe('aas-integration', () => {
    const sdk = new OpenDppClient({
      dpp: { baseURL },
    })
    sdk.setActiveOrganizationId(activeOrganization.id)
    it('should return aas connection', async () => {
      const response = await sdk.dpp.aasIntegration.getConnection(
        connection.id,
      )
      expect(response.data).toEqual({
        ...connection,
      })
    })

    it('should return all aas connections of organization', async () => {
      const response = await sdk.dpp.aasIntegration.getAllConnections()
      expect(response.data).toEqual(connectionList)
    })

    it('should create aas connection', async () => {
      const response = await sdk.dpp.aasIntegration.createConnection({
        name: 'Connection 1',
        aasType: AssetAdministrationShellType.Truck,
        dataModelId: randomUUID(),
        modelId: randomUUID(),
        fieldAssignments: [
          {
            dataFieldId: randomUUID(),
            sectionId: randomUUID(),
            idShortParent: 'Parent',
            idShort: 'Child',
          },
        ],
      })
      expect(response.data).toEqual({
        ...connection,
      })
    })

    it('should patch aas connection', async () => {
      const response = await sdk.dpp.aasIntegration.modifyConnection(
        connection.id,
        {
          name: 'Connection 2',
          modelId: randomUUID(),
          fieldAssignments: [
            {
              dataFieldId: randomUUID(),
              sectionId: randomUUID(),
              idShortParent: 'Parent',
              idShort: 'Child',
            },
          ],
        },
      )
      expect(response.data).toEqual({
        ...connection,
      })
    })

    it('should return aas properties with parent for given aas type', async () => {
      const response = await sdk.dpp.aasIntegration.getPropertiesOfAas(
        AssetAdministrationShellType.Truck,
      )
      expect(response.data).toEqual(aasPropertiesWithParent)
    })
  })
})
