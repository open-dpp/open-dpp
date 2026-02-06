import type { SubmodelResponseDto } from "@open-dpp/dto";
import { DataTypeDef, KeyTypes, PropertyJsonSchema } from "@open-dpp/dto";
import { propertyPlainFactory, submodelDesignOfProductPlainFactory, submodelPlainToResponse } from "@open-dpp/testing";
import { v4 as uuid4 } from "uuid";
import { expect, it, vi } from "vitest";
import PropertyCreateEditor from "../components/aas/PropertyCreateEditor.vue";
import PropertyEditor from "../components/aas/PropertyEditor.vue";
import SubmodelEditor from "../components/aas/SubmodelEditor.vue";
import { EditorMode, useAasDrawer } from "./aas-drawer.ts";

describe("aasDrawer composable", () => {
  const iriDomain = `https://open-dpp.de/${uuid4()}`;
  const onHideDrawer = vi.fn();
  it("should open drawer with SubmodelEditor, SubmodelCreateEditor", async () => {
    const submodel: SubmodelResponseDto = submodelPlainToResponse(
      submodelDesignOfProductPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const { openDrawer, drawerHeader, editorVNode } = useAasDrawer({ onHideDrawer });
    const data = submodel;
    const title = "Edit section";
    const path = { submodelId: submodel.id, idShortPath: data.idShort };
    const callback = async (_data: any) => { };

    openDrawer({ type: KeyTypes.Submodel, data, title, mode: EditorMode.EDIT, path, callback });

    expect(drawerHeader.value).toEqual(title);
    expect(editorVNode.value?.component).toEqual(SubmodelEditor);
    expect(editorVNode.value?.props).toEqual({ data, path, callback });

    openDrawer({ type: KeyTypes.Submodel, data, title, mode: EditorMode.EDIT, path: {}, callback });

    expect(drawerHeader.value).toEqual(title);
    expect(editorVNode.value?.component).toEqual(SubmodelEditor);
    expect(editorVNode.value?.props).toEqual({ data, path: {}, callback });
  });

  it("should open drawer with PropertyEditor, PropertyCreateEditor", async () => {
    const data = PropertyJsonSchema.parse(propertyPlainFactory.build());

    const { openDrawer, drawerVisible, hideDrawer, drawerHeader, editorVNode } = useAasDrawer({ onHideDrawer });
    const title = "Edit section";
    const path = { submodelId: "s1", idShortPath: data.idShort };
    const callback = async (_data: any) => { };
    openDrawer({ type: KeyTypes.Property, data, title, mode: EditorMode.EDIT, path, callback });
    expect(drawerVisible.value).toBeTruthy();

    expect(drawerHeader.value).toEqual(title);
    expect(editorVNode.value?.component).toEqual(PropertyEditor);
    expect(editorVNode.value?.props).toEqual({ data, path, callback });

    const createData = { valueType: DataTypeDef.String };
    openDrawer({ type: KeyTypes.Property, data: createData, title, mode: EditorMode.CREATE, path, callback });

    expect(drawerHeader.value).toEqual(title);
    expect(editorVNode.value?.component).toEqual(PropertyCreateEditor);
    expect(editorVNode.value?.props).toEqual({ data: createData, path, callback });

    hideDrawer();
    expect(drawerVisible.value).toBeFalsy();
    expect(onHideDrawer).toHaveBeenCalled();
  });
});
