import type { SubmodelResponseDto } from "@open-dpp/dto";
import { DataTypeDef, KeyTypes, PropertyJsonSchema } from "@open-dpp/dto";
import {
  propertyInputPlainFactory,
  submodelDesignOfProductPlainFactory,
  submodelPlainToResponse,
} from "@open-dpp/testing";
import { v4 as uuid4 } from "uuid";
import { describe, expect, it, vi } from "vitest";
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
    const mockCan = vi.fn();

    const { openDrawer, drawerHeader, editorVNode } = useAasDrawer({ onHideDrawer, can: mockCan });
    const data = submodel;
    const title = "Edit section";
    const path = { submodelId: submodel.id, idShortPath: data.idShort };
    const callback = async (_data: any) => {};

    openDrawer({ type: KeyTypes.Submodel, data, title, mode: EditorMode.EDIT, path, callback });

    expect(drawerHeader.value).toEqual(title);
    expect(editorVNode.value?.component).toEqual(SubmodelEditor);
    expect(editorVNode.value?.props).toEqual({
      data: { ...data, modelType: KeyTypes.Submodel },
      path,
      callback,
    });

    openDrawer({ type: KeyTypes.Submodel, data, title, mode: EditorMode.EDIT, path: {}, callback });

    expect(drawerHeader.value).toEqual(title);
    expect(editorVNode.value?.component).toEqual(SubmodelEditor);
    expect(editorVNode.value?.props).toEqual({
      data: { ...data, modelType: KeyTypes.Submodel },
      path: {},
      callback,
    });
  });

  it("should open drawer with PropertyEditor, PropertyCreateEditor", async () => {
    const data = PropertyJsonSchema.parse(propertyInputPlainFactory.build());
    const mockCan = vi.fn();

    const { openDrawer, drawerVisible, hideDrawer, drawerHeader, editorVNode } = useAasDrawer({
      onHideDrawer,
      can: mockCan,
    });
    const title = "Edit section";
    const path = { submodelId: "s1", idShortPath: data.idShort };
    const callback = async (_data: any) => {};
    openDrawer({ type: KeyTypes.Property, data, title, mode: EditorMode.EDIT, path, callback });
    expect(drawerVisible.value).toBeTruthy();

    expect(drawerHeader.value).toEqual(title);
    expect(editorVNode.value?.component).toEqual(PropertyEditor);
    expect(editorVNode.value?.props).toEqual({
      data: { ...data, modelType: KeyTypes.Property },
      path,
      callback,
    });

    const createData = { valueType: DataTypeDef.String };
    openDrawer({
      type: KeyTypes.Property,
      data: createData,
      title,
      mode: EditorMode.CREATE,
      path,
      callback,
    });

    expect(drawerHeader.value).toEqual(title);
    expect(editorVNode.value?.component).toEqual(PropertyCreateEditor);
    expect(editorVNode.value?.props).toEqual({ data: createData, path, callback });

    hideDrawer();
    expect(drawerVisible.value).toBeFalsy();
    expect(onHideDrawer).toHaveBeenCalled();
  });

  it("preserves modelType on editorVNode.props.data for a Property EDIT", () => {
    const data = PropertyJsonSchema.parse(propertyInputPlainFactory.build());
    const mockCan = vi.fn();
    const { openDrawer, editorVNode } = useAasDrawer({ onHideDrawer, can: mockCan });
    openDrawer({
      type: KeyTypes.Property,
      data,
      title: "x",
      mode: EditorMode.EDIT,
      path: { submodelId: "s1", idShortPath: data.idShort },
      callback: async () => {},
    });
    expect(editorVNode.value?.props.data.modelType).toBe(KeyTypes.Property);
  });

  describe("save button visibility when isEditingRestrictedToData", () => {
    const mockCanAllowed = () => true;

    it("stays visible for a Property (leaf value) editor", () => {
      const data = PropertyJsonSchema.parse(propertyInputPlainFactory.build());
      const { openDrawer, saveButtonIsVisible } = useAasDrawer({
        onHideDrawer,
        can: mockCanAllowed,
        isEditingRestrictedToData: true,
      });
      openDrawer({
        type: KeyTypes.Property,
        data,
        title: "x",
        mode: EditorMode.EDIT,
        path: { submodelId: "s1", idShortPath: data.idShort },
        callback: async () => {},
      });
      expect(saveButtonIsVisible.value).toBe(true);
    });

    it("is hidden for a Submodel (container, no leaf value) editor", () => {
      const submodel: SubmodelResponseDto = submodelPlainToResponse(
        submodelDesignOfProductPlainFactory.build(undefined, { transient: { iriDomain } }),
      );
      const { openDrawer, saveButtonIsVisible } = useAasDrawer({
        onHideDrawer,
        can: mockCanAllowed,
        isEditingRestrictedToData: true,
      });
      openDrawer({
        type: KeyTypes.Submodel,
        data: submodel,
        title: "x",
        mode: EditorMode.EDIT,
        path: { submodelId: submodel.id },
        callback: async () => {},
      });
      expect(saveButtonIsVisible.value).toBe(false);
    });

    it("is hidden for the AssetAdministrationShell editor, overriding its usual always-visible rule", () => {
      const { openDrawer, saveButtonIsVisible } = useAasDrawer({
        onHideDrawer,
        can: mockCanAllowed,
        isEditingRestrictedToData: true,
      });
      openDrawer({
        type: KeyTypes.AssetAdministrationShell,
        data: {} as any,
        title: "x",
        mode: EditorMode.EDIT,
        path: {},
        callback: async () => {},
      });
      expect(saveButtonIsVisible.value).toBe(false);
    });

    it("does not affect the save button when false (default)", () => {
      const data = PropertyJsonSchema.parse(propertyInputPlainFactory.build());
      const { openDrawer, saveButtonIsVisible } = useAasDrawer({
        onHideDrawer,
        can: mockCanAllowed,
      });
      openDrawer({
        type: KeyTypes.Submodel,
        data: {} as any,
        title: "x",
        mode: EditorMode.EDIT,
        path: { submodelId: "s1", idShortPath: data.idShort },
        callback: async () => {},
      });
      expect(saveButtonIsVisible.value).toBe(true);
    });
  });
});
