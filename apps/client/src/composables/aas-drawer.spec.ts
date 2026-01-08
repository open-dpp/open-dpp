import type { SubmodelResponseDto } from "@open-dpp/dto";
import { DataTypeDef, KeyTypes, PropertyJsonSchema } from "@open-dpp/dto";
import { propertyPlainFactory, submodelDesignOfProductPlainFactory, submodelPlainToResponse } from "@open-dpp/testing";
import { omit } from "lodash";
import { v4 as uuid4 } from "uuid";
import { expect, it } from "vitest";
import PropertyCreateEditor from "../components/aas/PropertyCreateEditor.vue";
import PropertyEditor from "../components/aas/PropertyEditor.vue";
import SubmodelCreateEditor from "../components/aas/SubmodelCreateEditor.vue";
import SubmodelEditor from "../components/aas/SubmodelEditor.vue";
import { EditorMode, useAasDrawer } from "./aas-drawer.ts";

describe("aasDrawer composable", () => {
  const iriDomain = `https://open-dpp.de/${uuid4()}`;

  it("should open drawer with submodel", async () => {
    const submodel: SubmodelResponseDto = submodelPlainToResponse(
      submodelDesignOfProductPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const { openDrawer, drawerHeader, editorVNode } = useAasDrawer();
    const data = omit(submodel, "submodelElements");
    const title = "Edit section";
    openDrawer({ type: KeyTypes.Submodel, data, title, mode: EditorMode.EDIT });

    expect(drawerHeader.value).toEqual(title);
    expect(editorVNode.value?.component).toEqual(SubmodelEditor);
    expect(editorVNode.value?.props).toEqual({ data });

    openDrawer({ type: KeyTypes.Submodel, data, title, mode: EditorMode.CREATE });

    expect(drawerHeader.value).toEqual(title);
    expect(editorVNode.value?.component).toEqual(SubmodelCreateEditor);
    expect(editorVNode.value?.props).toEqual({ data });
  });

  it("should open drawer with property", async () => {
    let data = PropertyJsonSchema.parse(propertyPlainFactory.build());

    const { openDrawer, drawerHeader, editorVNode } = useAasDrawer();
    const title = "Edit section";
    openDrawer({ type: KeyTypes.Property, data, title, mode: EditorMode.EDIT });

    expect(drawerHeader.value).toEqual(title);
    expect(editorVNode.value?.component).toEqual(PropertyEditor);
    expect(editorVNode.value?.props).toEqual({ data });

    data = { idShort: "newShort", valueType: DataTypeDef.String };
    openDrawer({ type: KeyTypes.Property, data, title, mode: EditorMode.CREATE });

    expect(drawerHeader.value).toEqual(title);
    expect(editorVNode.value?.component).toEqual(PropertyCreateEditor);
    expect(editorVNode.value?.props).toEqual({ data });
  });
});
