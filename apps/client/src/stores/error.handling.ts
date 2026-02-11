import { defineStore } from "pinia";
import { useNotificationStore } from "./notification";

export interface ErrorHandlingOptionsAsync { message: string; finallyCallback?: () => Promise<void> }
export interface ErrorHandlingOptionsSync {
  message: string;
  finallyCallback?: () => void;
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
    { message, finallyCallback }: ErrorHandlingOptionsAsync,
  ) => {
    try {
      await callback();
    }
    catch (e: unknown) {
      logErrorWithNotification(message, e);
    }
    finally {
      if (finallyCallback) {
        await finallyCallback();
      }
    }
  };

  const withErrorHandlingSync = <T>(
    callback: () => T,
    { message, finallyCallback }: ErrorHandlingOptionsSync,
  ) => {
    try {
      callback();
    }
    catch (e: unknown) {
      logErrorWithNotification(message, e);
    }
    finally {
      if (finallyCallback) {
        finallyCallback();
      }
    }
  };

  return { logErrorWithNotification, withErrorHandlingAsync, withErrorHandlingSync };
});
