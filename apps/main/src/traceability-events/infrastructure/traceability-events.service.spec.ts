import { Test, TestingModule } from '@nestjs/testing';
import { TraceabilityEventsService } from './traceability-events.service';
import {
  getConnectionToken,
  getModelToken,
  MongooseModule,
} from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { MongooseTestingModule } from '../../../test/mongo.testing.module';
import {
  DppEventSchema,
  TraceabilityEventDocument,
} from './traceability-event.document';
import { TraceabilityEventWrapper } from '../domain/traceability-event-wrapper';
import { TraceabilityEventType } from '../domain/traceability-event-type.enum';
import { randomUUID } from 'crypto';
import { OpenEpcisEvent } from '../modules/openepcis-events/domain/openepcis-event';
import { UntpEvent } from '../modules/untp-events/domain/untp-event';

describe('TraceabilityEventsService', () => {
  let service: TraceabilityEventsService;
  let mongoConnection: Connection;
  let dppEventModel: Model<TraceabilityEventDocument>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: TraceabilityEventDocument.name,
            schema: DppEventSchema,
          },
        ]),
      ],
      providers: [TraceabilityEventsService],
    }).compile();

    service = module.get<TraceabilityEventsService>(TraceabilityEventsService);
    mongoConnection = module.get<Connection>(getConnectionToken());
    dppEventModel = module.get<Model<TraceabilityEventDocument>>(
      getModelToken(TraceabilityEventDocument.name),
    );
  });

  afterEach(async () => {
    // Clean up the database after each test
    await dppEventModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoConnection.close(); // Close connection after tests
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('TraceabilityEventWrapper.loadFromDb', () => {
    it('should convert a TraceabilityEventDocument to a TraceabilityEventWrapper domain object', () => {
      // Arrange
      const id = randomUUID();
      const dppEventDoc = {
        _id: id,
        data: {
          type: TraceabilityEventType.OPENEPCIS,
        },
      } as TraceabilityEventDocument;

      // Act
      const result = TraceabilityEventWrapper.loadFromDb(dppEventDoc);

      // Assert
      expect(result).toBeInstanceOf(TraceabilityEventWrapper);
      expect(result.id).toBe(id);
      expect(result.data.type).toBe(TraceabilityEventType.OPENEPCIS);
    });

    it('should convert a TraceabilityEventDocument with createdAt and updatedAt to a TraceabilityEventWrapper domain object', () => {
      // Arrange
      const id = randomUUID();
      const createdAt = new Date('2023-01-01');
      const updatedAt = new Date('2023-01-02');
      const dppEventDoc = {
        _id: id,
        createdAt,
        updatedAt,
        data: {
          type: TraceabilityEventType.OPENEPCIS,
        },
      } as TraceabilityEventDocument;

      // Act
      const result = TraceabilityEventWrapper.loadFromDb(dppEventDoc);

      // Assert
      expect(result).toBeInstanceOf(TraceabilityEventWrapper);
      expect(result.id).toBe(id);
      expect(result.data.type).toBe(TraceabilityEventType.OPENEPCIS);
      expect(result.createdAt).toEqual(createdAt);
      expect(result.updatedAt).toEqual(updatedAt);
    });
  });

  describe('create', () => {
    it('should save a TraceabilityEventWrapper and return the saved domain object', async () => {
      // Arrange
      const id = randomUUID();
      const createdAt = new Date('2023-01-01');
      const updatedAt = new Date('2023-01-02');
      const ip = '192.168.1.1';
      const userId = 'user123';
      const itemId = 'article123';
      const chargeId = 'charge123';
      const organizationId = 'org123';
      const geolocation = {
        latitude: '52.5200',
        longitude: '13.4050',
      };
      const dppEvent = TraceabilityEventWrapper.loadFromDb({
        _id: id,
        createdAt,
        updatedAt,
        data: {
          type: TraceabilityEventType.OPENEPCIS,
        },
        ip,
        userId,
        itemId,
        organizationId,
        type: TraceabilityEventType.OPENEPCIS,
        chargeId,
        geolocation,
      });

      // Act
      const result = await service.create(dppEvent);

      // Assert
      expect(result).toBeInstanceOf(TraceabilityEventWrapper);
      expect(result.id).toBe(id);
      expect(result.data.type).toBe(TraceabilityEventType.OPENEPCIS);

      // Verify it was saved to the database
      const savedDoc = await dppEventModel.findOne({ _id: id }).exec();
      expect(savedDoc).toBeDefined();
      expect(savedDoc._id).toBe(id);
      expect(savedDoc.data.type).toBe(TraceabilityEventType.OPENEPCIS);
    });

    it('should save a TraceabilityEventWrapper with custom createdAt and updatedAt dates', async () => {
      // Arrange
      const id = randomUUID();
      const createdAt = new Date('2023-01-01');
      const updatedAt = new Date('2023-01-02');
      const ip = '192.168.1.1';
      const userId = 'user123';
      const itemId = 'article123';
      const chargeId = 'charge123';
      const organizationId = 'org123';
      const geolocation = {
        latitude: '52.5200',
        longitude: '13.4050',
      };
      const dppEvent = TraceabilityEventWrapper.loadFromDb({
        _id: id,
        data: {
          type: TraceabilityEventType.OPENEPCIS,
        },
        createdAt,
        updatedAt,
        ip,
        userId,
        itemId,
        organizationId,
        type: TraceabilityEventType.OPENEPCIS,
        chargeId,
        geolocation,
      });

      // Act
      const result = await service.create(dppEvent);

      // Assert
      expect(result).toBeInstanceOf(TraceabilityEventWrapper);
      expect(result.id).toBe(id);
      expect(result.data.type).toBe(TraceabilityEventType.OPENEPCIS);
      expect(result.createdAt).toEqual(createdAt);
      // The updatedAt date should be updated to the current time
      expect(result.updatedAt).not.toEqual(updatedAt);

      // Verify it was saved to the database
      const savedDoc = await dppEventModel.findOne({ _id: id }).exec();
      expect(savedDoc).toBeDefined();
      expect(savedDoc._id).toBe(id);
      expect(savedDoc.data.type).toBe(TraceabilityEventType.OPENEPCIS);
      expect(savedDoc.createdAt).toEqual(createdAt);
      // The updatedAt date should be updated to the current time
      expect(savedDoc.updatedAt).not.toEqual(updatedAt);
    });

    it('should save a TraceabilityEventWrapper with all metadata fields', async () => {
      // Arrange
      const id = randomUUID();
      const createdAt = new Date('2023-01-01');
      const updatedAt = new Date('2023-01-02');
      const ip = '192.168.1.1';
      const userId = 'user123';
      const itemId = 'article123';
      const chargeId = 'charge123';
      const organizationId = 'org123';
      const geolocation = {
        latitude: '52.5200',
        longitude: '13.4050',
      };
      const type = TraceabilityEventType.OPENEPCIS;

      const dppEvent = TraceabilityEventWrapper.loadFromDb({
        _id: id,
        createdAt,
        updatedAt,
        ip,
        userId,
        itemId,
        chargeId,
        organizationId,
        geolocation,
        type,
        data: {
          type: TraceabilityEventType.OPENEPCIS,
        },
      });

      // Act
      const result = await service.create(dppEvent);

      // Assert
      expect(result).toBeInstanceOf(TraceabilityEventWrapper);
      expect(result.id).toBe(id);
      expect(result.ip).toBe(ip);
      expect(result.userId).toBe(userId);
      expect(result.itemId).toBe(itemId);
      expect(result.chargeId).toBe(chargeId);
      expect(result.organizationId).toBe(organizationId);
      expect(result.geolocation).toEqual(geolocation);
      expect(result.type).toBe(type);

      // Verify it was saved to the database
      const savedDoc = await dppEventModel.findOne({ _id: id }).exec();
      expect(savedDoc).toBeDefined();
      expect(savedDoc._id).toBe(id);
      expect(savedDoc.ip).toBe(ip);
      expect(savedDoc.userId).toBe(userId);
      expect(savedDoc.itemId).toBe(itemId);
      expect(savedDoc.chargeId).toBe(chargeId);
      expect(savedDoc.organizationId).toBe(organizationId);
      expect(savedDoc.geolocation).toEqual(geolocation);
      expect(savedDoc.type).toBe(type);
    });
  });

  describe('findById', () => {
    it('should find TraceabilityEvents by id', async () => {
      // Arrange
      const id = randomUUID();
      await dppEventModel.create({
        _id: id,
        data: {
          type: TraceabilityEventType.OPENEPCIS,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.findById(id);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(id);
      expect(result[0].data.type).toBe(TraceabilityEventType.OPENEPCIS);
    });

    it('should return an empty array if no TraceabilityEvents are found by id', async () => {
      // Act
      const result = await service.findById('non-existent-id');

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('findByDataType', () => {
    it('should find TraceabilityEvents by data type', async () => {
      // Arrange
      const id1 = randomUUID();
      const id2 = randomUUID();
      const dataType = TraceabilityEventType.OPENEPCIS;

      await dppEventModel.create({
        _id: id1,
        data: {
          type: TraceabilityEventType.OPENEPCIS,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await dppEventModel.create({
        _id: id2,
        data: {
          type: TraceabilityEventType.OPENEPCIS,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.findByDataType(dataType);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].data.type).toBe(dataType);
      expect(result[1].data.type).toBe(dataType);

      // Verify both events were found
      const ids = result.map((event) => event.id);
      expect(ids).toContain(id1);
      expect(ids).toContain(id2);
    });

    it('should return an empty array if no TraceabilityEvents are found by data type', async () => {
      // Act
      const result = await service.findByDataType(undefined);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('TraceabilityEvent Discriminators', () => {
    describe('OpenDppEvent discriminator', () => {
      it('should save and retrieve an OpenDppEvent with proper discriminator', async () => {
        // Arrange
        const userId = randomUUID();
        const itemId = randomUUID();
        const organizationId = randomUUID();
        const openDppEvent = TraceabilityEventWrapper.create({
          userId,
          itemId,
          organizationId,
          data: {
            type: TraceabilityEventType.OPEN_DPP,
          },
          type: TraceabilityEventType.OPEN_DPP,
          ip: null,
          chargeId: null,
          geolocation: null,
        });

        // Act
        await service.create(openDppEvent);

        // Assert
        const savedDoc = await dppEventModel
          .findOne({ _id: openDppEvent.id })
          .exec();
        expect(savedDoc).toBeDefined();
        expect(savedDoc._id).toBe(openDppEvent.id);
        expect(savedDoc.data.type).toBe(TraceabilityEventType.OPEN_DPP);

        // Verify the document uses the correct discriminator
        const retrievedEvents = await service.findByDataType(
          TraceabilityEventType.OPEN_DPP,
        );
        expect(retrievedEvents).toHaveLength(1);
        expect(retrievedEvents[0].id).toBe(savedDoc._id);
        expect(retrievedEvents[0].data.type).toBe(
          TraceabilityEventType.OPEN_DPP,
        );
      });
    });

    describe('OpenepcisEvent discriminator', () => {
      it('should save and retrieve an OpenepcisEvent with proper discriminator', async () => {
        // Arrange
        const userId = randomUUID();
        const itemId = randomUUID();
        const organizationId = randomUUID();
        const openepcisEvent = TraceabilityEventWrapper.create({
          userId,
          itemId,
          organizationId,
          data: {
            type: TraceabilityEventType.OPENEPCIS,
          },
          type: TraceabilityEventType.OPENEPCIS,
          ip: null,
          chargeId: null,
          geolocation: null,
        });
        const id = openepcisEvent.id;

        // Act
        await service.create(openepcisEvent);

        // Assert
        const savedDoc = await dppEventModel.findOne({ _id: id }).exec();
        expect(savedDoc).toBeDefined();
        expect(savedDoc._id).toBe(id);
        expect(savedDoc.data.type).toBe(TraceabilityEventType.OPENEPCIS);

        // Verify the document uses the correct discriminator
        const retrievedEvents = await service.findByDataType(
          TraceabilityEventType.OPENEPCIS,
        );
        expect(retrievedEvents).toHaveLength(1);
        expect(retrievedEvents[0].id).toBe(id);
        expect(retrievedEvents[0].data.type).toBe(
          TraceabilityEventType.OPENEPCIS,
        );
      });

      describe('OpenEpcisEvent class', () => {
        it('should create an OpenEpcisEvent with the correct type', () => {
          // Arrange & Act
          const eventData = { key: 'value' };
          const userId = randomUUID();
          const itemId = randomUUID();
          const organizationId = randomUUID();
          const wrapper = OpenEpcisEvent.create({
            userId,
            itemId,
            organizationId,
            childData: eventData,
          });

          // Assert
          expect(wrapper).toBeDefined();
          expect(wrapper.type).toBe(TraceabilityEventType.OPENEPCIS);
          expect(wrapper.data.data).toEqual(eventData);
        });

        it('should store and retrieve OpenEpcisEvent data correctly', async () => {
          // Arrange
          const eventData = {
            productId: randomUUID(),
            quantity: 10,
            location: 'Warehouse A',
          };
          const userId = randomUUID();
          const itemId = randomUUID();
          const organizationId = randomUUID();

          const wrapper = OpenEpcisEvent.create({
            userId,
            itemId,
            organizationId,
            childData: eventData,
          });

          // Act
          await service.create(wrapper);

          // Assert
          const retrievedEvents = await service.findByDataType(
            TraceabilityEventType.OPENEPCIS,
          );

          expect(retrievedEvents).toHaveLength(1);
          expect(retrievedEvents[0].data.type).toBe(
            TraceabilityEventType.OPENEPCIS,
          );

          // Cast to OpenEpcisEvent to access data property
          const retrievedEvent = retrievedEvents[0].data as OpenEpcisEvent;
          expect(retrievedEvent.data).toEqual(eventData);
        });
      });
    });

    describe('UntpEvent discriminator', () => {
      it('should save and retrieve a UntpEvent with proper discriminator', async () => {
        // Arrange
        const userId = randomUUID();
        const itemId = randomUUID();
        const organizationId = randomUUID();
        const untpEvent = UntpEvent.create({
          userId,
          itemId,
          organizationId,
          childData: {
            type: TraceabilityEventType.UNTP,
          },
        });
        const id = untpEvent.id;

        // Act
        await service.create(untpEvent);

        // Assert
        const savedDoc = await dppEventModel.findOne({ _id: id }).exec();
        expect(savedDoc).toBeDefined();
        expect(savedDoc._id).toBe(id);
        expect(savedDoc.data.type).toBe(TraceabilityEventType.UNTP);

        // Verify the document uses the correct discriminator
        const retrievedEvents = await service.findByDataType(
          TraceabilityEventType.UNTP,
        );
        expect(retrievedEvents).toHaveLength(1);
        expect(retrievedEvents[0].id).toBe(id);
        expect(retrievedEvents[0].data.type).toBe(TraceabilityEventType.UNTP);
      });

      describe('UntpEvent class', () => {
        it('should create a UntpEvent with the correct type', () => {
          // Arrange & Act
          const eventData = { key: 'value' };
          const userId = randomUUID();
          const itemId = randomUUID();
          const organizationId = randomUUID();
          const wrapper = UntpEvent.create({
            userId,
            itemId,
            organizationId,
            childData: eventData,
          });

          // Assert
          expect(wrapper).toBeDefined();
          expect(wrapper.type).toBe(TraceabilityEventType.UNTP);
          expect(wrapper.data.data).toEqual(eventData);
        });

        it('should store and retrieve UntpEvent data correctly', async () => {
          // Arrange
          const eventData = {
            transactionId: randomUUID(),
            amount: 500,
            currency: 'USD',
            status: 'completed',
          };

          const userId = randomUUID();
          const itemId = randomUUID();
          const organizationId = randomUUID();
          const wrapper = UntpEvent.create({
            userId,
            itemId,
            organizationId,
            childData: eventData,
          });

          // Act
          await service.create(wrapper);

          // Assert
          const retrievedEvents = await service.findByDataType(
            TraceabilityEventType.UNTP,
          );

          expect(retrievedEvents).toHaveLength(1);
          expect(retrievedEvents[0].data.type).toBe(TraceabilityEventType.UNTP);

          // Cast to UntpEvent to access data property
          const retrievedEvent = retrievedEvents[0].data as UntpEvent;
          expect(retrievedEvent.data).toEqual(eventData);
        });
      });
    });

    describe('Mixed discriminators', () => {
      it('should correctly retrieve events by their discriminator type', async () => {
        // Arrange
        const openDppId = randomUUID();
        const openepcisId = randomUUID();
        const untpId = randomUUID();

        // Create one of each event type
        await dppEventModel.create([
          {
            _id: openDppId,
            data: {
              type: TraceabilityEventType.OPEN_DPP,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            _id: openepcisId,
            data: {
              type: TraceabilityEventType.OPENEPCIS,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            _id: untpId,
            data: {
              type: TraceabilityEventType.UNTP,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);

        // Act & Assert
        // Check OpenDpp events
        const openDppEvents = await service.findByDataType(
          TraceabilityEventType.OPEN_DPP,
        );
        expect(openDppEvents).toHaveLength(1);
        expect(openDppEvents[0].id).toBe(openDppId);
        expect(openDppEvents[0].data.type).toBe(TraceabilityEventType.OPEN_DPP);

        // Check Openepcis events
        const openepcisEvents = await service.findByDataType(
          TraceabilityEventType.OPENEPCIS,
        );
        expect(openepcisEvents).toHaveLength(1);
        expect(openepcisEvents[0].id).toBe(openepcisId);
        expect(openepcisEvents[0].data.type).toBe(
          TraceabilityEventType.OPENEPCIS,
        );

        // Check Untp events
        const untpEvents = await service.findByDataType(
          TraceabilityEventType.UNTP,
        );
        expect(untpEvents).toHaveLength(1);
        expect(untpEvents[0].id).toBe(untpId);
        expect(untpEvents[0].data.type).toBe(TraceabilityEventType.UNTP);

        // Verify we can get all events
        const allEvents = await dppEventModel.find().exec();
        expect(allEvents).toHaveLength(3);
      });
    });
  });
});
