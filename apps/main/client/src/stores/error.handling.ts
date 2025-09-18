import { defineStore } from 'pinia';
import { useNotificationStore } from './notification';

export const useErrorHandlingStore = defineStore('error-handling-store', () => {
  const notificationStore = useNotificationStore();

  const logErrorWithNotification = (message: string, error?: unknown) => {
    notificationStore.addErrorNotification(message);
    console.error(message, error);
  };

  return { logErrorWithNotification };
});
