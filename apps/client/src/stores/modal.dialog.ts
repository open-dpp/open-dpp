import { defineStore } from "pinia";
import { ref } from "vue";
import { useNotificationStore } from "./notification";

type ConfirmAction = () => Promise<void>;
type CancelAction = () => void;
interface Content {
  title: string;
  description: string;
  type?: "info" | "warning";
}

export const useModelDialogStore = defineStore("model-dialog-store", () => {
  const defaultContent: Content = { title: "", description: "" };
  const isOpen = ref<boolean>(false);
  const confirmAction = ref<ConfirmAction | null>(null);
  const cancelAction = ref<CancelAction | null>(null);
  const content = ref<Content>(defaultContent);
  const { t } = i18n.global;

  const open = (
    dialogContent: Content,
    confirmActionCallback: () => Promise<void>,
    cancelActionCallback?: () => void,
  ) => {
    isOpen.value = true;
    content.value = dialogContent;
    confirmAction.value = confirmActionCallback;
    cancelAction.value = cancelActionCallback ?? null;
  };

  const close = () => {
    isOpen.value = false;
    confirmAction.value = null;
    cancelAction.value = null;
    content.value = defaultContent;
  };

  const confirm = async () => {
    if (confirmAction.value) {
      try {
        await confirmAction.value();
      }
      catch {
        const notificationStore = useNotificationStore();
        notificationStore.addErrorNotification(t('common.unknownErrorOccured'));
      }
    }
    close();
  };

  const cancel = () => {
    if (cancelAction.value) {
      cancelAction.value();
    }
    close();
  };

  return { open, close, confirm, cancel, isOpen, content };
});
