import { z } from 'zod';
import {
  UniqueProductIdentifierDtoSchema,
  uniqueProductIdentifierToDto,
} from '../../../unique-product-identifier/presentation/dto/unique-product-identifier-dto.schema';
import { Item } from '../../domain/item';
import {
  DataValueDtoSchema,
  dataValueToDto,
} from '../../../product-passport-data/presentation/dto/data-value.dto';

export const ItemDtoSchema = z.object({
  id: z.uuid(),
  uniqueProductIdentifiers: UniqueProductIdentifierDtoSchema.array(),
  templateId: z.uuid(),
  dataValues: DataValueDtoSchema.array(),
});

export type ItemDto = z.infer<typeof ItemDtoSchema>;

export function itemToDto(item: Item): ItemDto {
  return ItemDtoSchema.parse({
    id: item.id,
    uniqueProductIdentifiers: item.uniqueProductIdentifiers.map((u) =>
      uniqueProductIdentifierToDto(u),
    ),
    templateId: item.templateId,
    dataValues: item.dataValues.map((d) => dataValueToDto(d)),
  });
}
