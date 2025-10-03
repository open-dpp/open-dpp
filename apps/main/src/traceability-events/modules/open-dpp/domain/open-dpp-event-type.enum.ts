export const OpenDppEventType = {
  UNIQUE_PRODUCT_IDENTIFIER_CREATED: 'UNIQUE_PRODUCT_IDENTIFIER_CREATED',
  ITEM_CREATED: 'ITEM_CREATED',
} as const

export type OpenDppEventType_TYPE = (typeof OpenDppEventType)[keyof typeof OpenDppEventType]
