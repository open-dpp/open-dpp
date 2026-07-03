import { z } from "zod";

/**
 * Schema for creating a new internal (`OPEN_DPP_UUID`) UniqueProductIdentifier.
 *
 * An internal UPI carries no external identity data — its identity *is* its own
 * generated `uuid` — so the only input is the passport it belongs to. The server
 * mints the `uuid`. A user-created internal UPI is never the passport's canonical
 * (auto-minted, oldest) row, and so stays editable/deletable while the passport is
 * a draft. See ADR 0005.
 *
 * - `referenceId` — UUID of the passport this UPI belongs to
 */
export const CreateInternalUniqueProductIdentifierRequestSchema = z
  .object({
    referenceId: z.uuid(),
  })
  .meta({ id: "CreateInternalUniqueProductIdentifierRequest" });

export type CreateInternalUniqueProductIdentifierRequest = z.infer<
  typeof CreateInternalUniqueProductIdentifierRequestSchema
>;
