import { createPinia, setActivePinia } from 'pinia';
import { expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/vue';
import { useModelDialogStore } from './modal.dialog';

describe('ModelDialogStore', () => {
  beforeEach(() => {
    // Create a fresh pinia instance and make it active
    setActivePinia(createPinia());
  });

  it('should set values on open and call confirmAction on confirm', async () => {
    const modelDialogStore = useModelDialogStore();
    const cancelAction = vi.fn();
    const confirmAction = vi.fn();
    const title = 'My title';
    const description = 'My text';
    modelDialogStore.open({ title, description }, confirmAction, cancelAction);
    expect(modelDialogStore.isOpen).toBeTruthy();
    expect(modelDialogStore.content.description).toEqual(description);
    await modelDialogStore.confirm();
    await waitFor(() => expect(confirmAction).toHaveBeenCalledWith());
    expect(modelDialogStore.isOpen).toBeFalsy();
    expect(modelDialogStore.content.description).toEqual('');
  });

  it('should set values on open and call cancelAction on cancel', async () => {
    const modelDialogStore = useModelDialogStore();
    const cancelAction = vi.fn();
    const confirmAction = vi.fn();
    const title = 'My title';
    const description = 'My text';
    modelDialogStore.open({ title, description }, confirmAction, cancelAction);
    expect(modelDialogStore.isOpen).toBeTruthy();
    expect(modelDialogStore.content.description).toEqual(description);
    await modelDialogStore.cancel();
    await waitFor(() => expect(cancelAction).toHaveBeenCalledWith());
    expect(modelDialogStore.isOpen).toBeFalsy();
    expect(modelDialogStore.content.description).toEqual('');
  });
});
