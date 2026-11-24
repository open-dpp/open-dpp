import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { Environment } from "../../aas/domain/environment";
import { EditingMode } from "../../digital-product-document/domain/editing-mode";
import { Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { Template } from "../domain/template";
import { toTemplateDto, toTemplatePaginationDto } from "./template-dto.mapper";

function createTemplate() {
  return Template.create({ organizationId: randomUUID(), environment: Environment.create({}) });
}

describe("template dto mapper", () => {
  it("maps a draft template to Full", () => {
    const template = createTemplate();

    const dto = toTemplateDto(template);

    expect(dto.id).toEqual(template.id);
    expect(dto.editingMode).toEqual(EditingMode.Full);
    expect(dto).not.toHaveProperty("passportEditingMode");
  });

  it("maps a published template to ReadOnly", () => {
    const template = createTemplate();
    template.publish();

    expect(toTemplateDto(template).editingMode).toEqual(EditingMode.ReadOnly);
  });

  it("maps an archived template to ReadOnly", () => {
    const template = createTemplate();
    template.archive();

    expect(toTemplateDto(template).editingMode).toEqual(EditingMode.ReadOnly);
  });

  it("maps every item of a page with its own editing mode", () => {
    const draft = createTemplate();
    const published = createTemplate();
    published.publish();
    const pagingResult = PagingResult.create({
      pagination: Pagination.create({ limit: 10 }),
      items: [draft, published],
      totalCount: 2,
    });

    const dto = toTemplatePaginationDto(pagingResult);

    expect(dto.paging_metadata.total_count).toEqual(2);
    expect(dto.result.map((t) => [t.id, t.editingMode])).toEqual([
      [draft.id, EditingMode.Full],
      [published.id, EditingMode.ReadOnly],
    ]);
  });
});
