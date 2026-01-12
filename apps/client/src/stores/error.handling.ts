import { defineStore } from "pinia";
import { useNotificationStore } from "./notification";

export interface IErrorHandlingStore {
  logErrorWithNotification: (message: string, error?: unknown) => void;
}

export const useErrorHandlingStore = defineStore("error-handling-store", (): IErrorHandlingStore => {
  const notificationStore = useNotificationStore();

  const logErrorWithNotification = (message: string, error?: unknown) => {
    notificationStore.addErrorNotification(message);
    console.error(message, error);
  };

  return { logErrorWithNotification };
});
