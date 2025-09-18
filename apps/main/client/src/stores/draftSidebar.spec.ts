import { createPinia, setActivePinia } from 'pinia';
import { expect, it } from 'vitest';
import { SidebarContentType, useDraftSidebarStore } from './draftSidebar';
import SectionSelection from '../components/template-drafts/SectionSelection.vue';
import { DataFieldType, SectionType } from '@open-dpp/api-client';
import DataFieldForm from '../components/template-drafts/DataFieldForm.vue';
import SectionForm from '../components/template-drafts/SectionForm.vue';

describe('DraftSidebarStore', () => {
  beforeEach(() => {
    // Create a fresh pinia instance and make it active
    setActivePinia(createPinia());
  });

  it('should open NodeSelection and close sidebar', async () => {
    const draftSidebarStore = useDraftSidebarStore();
    expect(draftSidebarStore.isOpen).toBeFalsy();
    draftSidebarStore.open(SidebarContentType.SECTION_SELECTION, {
      parentId: 'p1',
    });
    expect(draftSidebarStore.title).toEqual('Abschnitt hinzufügen');
    expect(draftSidebarStore.subTitle).toEqual('Auswahl');
    expect(draftSidebarStore.isOpen).toBeTruthy();
    expect(draftSidebarStore.content).toEqual(SectionSelection);
    expect(draftSidebarStore.contentProps).toEqual({ parentId: 'p1' });
    draftSidebarStore.close();
    expect(draftSidebarStore.isOpen).toBeFalsy();
  });

  it('should set SectionForm', async () => {
    const draftSidebarStore = useDraftSidebarStore();
    draftSidebarStore.setContentWithProps(SidebarContentType.SECTION_FORM, {
      type: SectionType.REPEATABLE,
      parentId: 'id',
    });
    expect(draftSidebarStore.title).toEqual('Abschnitt');
    expect(draftSidebarStore.subTitle).toEqual('Konfiguration');
    expect(draftSidebarStore.content).toEqual(SectionForm);
    expect(draftSidebarStore.contentProps).toEqual({
      type: SectionType.REPEATABLE,
      parentId: 'id',
    });
  });

  it('should set FieldForm', async () => {
    const draftSidebarStore = useDraftSidebarStore();
    draftSidebarStore.setContentWithProps(SidebarContentType.DATA_FIELD_FORM, {
      type: DataFieldType.TEXT_FIELD,
      parentId: 'id',
    });
    expect(draftSidebarStore.title).toEqual('Datenfeld');
    expect(draftSidebarStore.subTitle).toEqual('Konfiguration');
    expect(draftSidebarStore.content).toEqual(DataFieldForm);
    expect(draftSidebarStore.contentProps).toEqual({
      type: DataFieldType.TEXT_FIELD,
      parentId: 'id',
    });
  });
});
