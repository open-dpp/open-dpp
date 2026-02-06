import { defineStore } from "pinia";
import { useNotificationStore } from "./notification";

export interface ErrorHandlingOptionsAsync { message: string; errorCallback?: (e: unknown) => Promise<void> }
export interface ErrorHandlingOptionsSync {
  message: string;
  errorCallback?: (e: unknown) => void;
}

export interface IErrorHandlingStore {
  logErrorWithNotification: (message: string, error?: unknown) => void;
  withErrorHandlingAsync: <T>(
    callback: () => Promise<T>,
    options: ErrorHandlingOptionsAsync,
  ) => Promise<void>;
  withErrorHandlingSync: <T>(
    callback: () => T,
    options: ErrorHandlingOptionsSync,
  ) => void;
}

export const useErrorHandlingStore = defineStore("error-handling-store", (): IErrorHandlingStore => {
  const notificationStore = useNotificationStore();

  const logErrorWithNotification = (message: string, error?: unknown) => {
    notificationStore.addErrorNotification(message);
    console.error(message, error);
  };

  const withErrorHandlingAsync = async <T>(
    callback: () => Promise<T>,
    { message, errorCallback }: ErrorHandlingOptionsAsync,
  ) => {
    try {
      await callback();
    }
    catch (e: unknown) {
      logErrorWithNotification(message, e);
      if (errorCallback) {
        await errorCallback(e);
      }
    }
  };

  const withErrorHandlingSync = async <T>(
    callback: () => T,
    { message, errorCallback }: ErrorHandlingOptionsSync,
  ) => {
    try {
      callback();
    }
    catch (e: unknown) {
      logErrorWithNotification(message, e);
      if (errorCallback) {
        errorCallback(e);
      }
    }
  };

  return { logErrorWithNotification, withErrorHandlingAsync, withErrorHandlingSync };
});
