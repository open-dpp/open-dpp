import { defineStore } from 'pinia';
import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export enum NotificationType {
  SUCCESS = 'Success',
  ERROR = 'Error',
  INFO = 'Info',
  WARNING = 'Warning',
}

type ActionLink = { to: string; label: string };
export type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  actionLink?: ActionLink;
};

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([]);

  const addNotification = (
    message: string,
    type: NotificationType,
    actionLink?: ActionLink,
    duration: number = 6000,
  ) => {
    const id = uuidv4();
    notifications.value.push({
      id,
      type,
      message,
      actionLink,
    });
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const addSuccessNotification = (
    message: string,
    actionLink?: ActionLink,
    duration: number = 6000,
  ) => addNotification(message, NotificationType.SUCCESS, actionLink, duration);

  const addErrorNotification = (
    message: string,
    actionLink?: ActionLink,
    duration: number = 6000,
  ) => {
    return addNotification(
      message,
      NotificationType.ERROR,
      actionLink,
      duration,
    );
  };

  const addInfoNotification = (
    message: string,
    actionLink?: ActionLink,
    duration: number = 6000,
  ) => addNotification(message, NotificationType.INFO, actionLink, duration);

  const addWarningNotification = (
    message: string,
    actionLink?: ActionLink,
    duration: number = 6000,
  ) => addNotification(message, NotificationType.WARNING, actionLink, duration);

  const removeNotification = (id: string) => {
    notifications.value = notifications.value.filter((n) => n.id !== id);
  };
  return {
    notifications,
    removeNotification,
    addErrorNotification,
    addSuccessNotification,
    addInfoNotification,
    addWarningNotification,
  };
});
