# DPP Events Documentation

This document provides an overview of the event structure in the DPP (Digital Product Passport) project.

## Event Hierarchy

The event system in this project follows a hierarchical structure:

```
TraceabilityEventWrapper (Parent)
├── UntpEvent
├── OpenepcisEvent
└── OpenDppEvent
    └── UniqueProductIdentifierCreatedEventDocument
```

### TraceabilityEventWrapper

`TraceabilityEventWrapper` is the parent class for all events in the system. It provides the base structure that all
event types inherit
from.

**Properties:**

- `id`: A unique identifier for the event (UUID)
- `type`: The type of the event (from `DppEventType` enum)
- `source`: The source of the event
- `eventJsonData`: The event data as a JSON string
- `createdAt`: The creation timestamp
- `updatedAt`: The last update timestamp

**Event Types (DppEventType):**

- `OPENEPCIS_V3_0`: OpenEPCIS events (version 3.0)
- `UNTP`: UNTP events
- `OPEN_DPP`: Open DPP events

## Child Event Types

### OpenDppEvent

`OpenDppEvent` is a specific type of `TraceabilityEventWrapper` for Open DPP events.

**Additional Properties:**

- `schemaVersion`: The schema version of the event (from `OpenDppEventSchemaVersion` enum)
- `subType`: Used for referenced data of the event

**Schema Versions (OpenDppEventSchemaVersion):**

- `v1_0_0`: Version 1.0.0

**Event Types (OpenDppEventType):**

- `UNIQUE_PRODUCT_IDENTIFIER_CREATED`: Event for when a unique product identifier is created

#### UniqueProductIdentifierCreatedEventDocument

`UniqueProductIdentifierCreatedEventDocument` is a specific type of `OpenDppEvent` for when a unique product identifier
is created.

**Additional Properties:**

- `uniqueProductIdentifierId`: The ID of the unique product identifier that was created

**Schema Versions (UniqueProductIdentifierCreatedEventSchemaVersion):**

- `v1_0_0`: Version 1.0.0

### OpenepcisEvent

`OpenepcisEvent` is a specific type of `TraceabilityEventWrapper` for OpenEPCIS events.

### UntpEvent

`UntpEvent` is a specific type of `TraceabilityEventWrapper` for UNTP events.

## Creating New Event Types

To create a new event type:

1. Add the new event type to the appropriate enum:
   - For a new DPP event type, add it to `DppEventType`
   - For a new Open DPP event type, add it to `OpenDppEventType`

2. Create a new class for the event type if needed:
   - For a new Open DPP event sub-type, create a new class in the `open-dpp-events` directory
   - Follow the pattern of existing event classes like `UniqueProductIdentifierCreatedEventDocument`

3. Update the service layer to handle the new event type:
   - Update the appropriate service class to handle the new event type
   - Add any necessary methods for creating, finding, and processing the new event type

## Using Events in the System

Events are used to track and record actions and changes in the system. They provide a historical record of what
happened, when it happened, and who or what initiated the action.

To create and save an event:

```typescript
// Create a new event
const event = TraceabilityEventWrapper.create({
  type: DppEventType.OPEN_DPP,
  source: "source-identifier",
  eventJsonData: JSON.stringify(data),
});

// Save the event
await dppEventsService.save(event);
```

To find events:

```typescript
// Find events by ID
const events = await dppEventsService.findById("event-id");

// Find events by source
const events = await dppEventsService.findByDppId("source-identifier");

// Find events by type
const events = await dppEventsService.findByType(DppEventType.OPEN_DPP);
```
