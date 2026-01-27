import { defineStore } from "pinia";
import { useNotificationStore } from "./notification";

interface ErrorHandlingOptions { message: string; errorCallback?: (e: unknown) => Promise<void> }
export interface IErrorHandlingStore {
  logErrorWithNotification: (message: string, error?: unknown) => void;
  withErrorHandling: <T>(callback: Promise<T>, options: ErrorHandlingOptions) => Promise<void>;
}

export const useErrorHandlingStore = defineStore("error-handling-store", (): IErrorHandlingStore => {
  const notificationStore = useNotificationStore();

  const logErrorWithNotification = (message: string, error?: unknown) => {
    notificationStore.addErrorNotification(message);
    console.error(message, error);
  };

  const withErrorHandling = async <T>(callback: Promise<T>, { message, errorCallback }: ErrorHandlingOptions) => {
    try {
      await callback;
    }
    catch (e: unknown) {
      logErrorWithNotification(message, e);
      if (errorCallback) {
        await errorCallback(e);
      }
    }
  };

  return { logErrorWithNotification, withErrorHandling };
});
