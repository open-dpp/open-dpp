import { createPinia, setActivePinia } from "pinia";
import { expect, it } from "vitest";
import { NotificationType, useNotificationStore } from "./notification";
import { v4 as uuidv4 } from "uuid";

describe("Notification", () => {
  beforeEach(() => {
    // Create a fresh pinia instance and make it active
    setActivePinia(createPinia());
  });

  it("should add success notification", async () => {
    const notificationStore = useNotificationStore();
    expect(notificationStore.notifications).toEqual([]);
    notificationStore.addSuccessNotification("Added draft");
    expect(notificationStore.notifications).toEqual([
      {
        id: expect.any(String),
        message: "Added draft",
        type: NotificationType.SUCCESS,
      },
    ]);
  });
  it("should add error notification", async () => {
    const notificationStore = useNotificationStore();
    expect(notificationStore.notifications).toEqual([]);
    notificationStore.addErrorNotification("Added draft");
    expect(notificationStore.notifications).toEqual([
      {
        id: expect.any(String),
        message: "Added draft",
        type: NotificationType.ERROR,
      },
    ]);
  });

  it("should add warning notification", async () => {
    const notificationStore = useNotificationStore();
    expect(notificationStore.notifications).toEqual([]);
    notificationStore.addWarningNotification("Added draft");
    expect(notificationStore.notifications).toEqual([
      {
        id: expect.any(String),
        message: "Added draft",
        type: NotificationType.WARNING,
      },
    ]);
  });

  it("should add info notification", async () => {
    const notificationStore = useNotificationStore();
    expect(notificationStore.notifications).toEqual([]);
    notificationStore.addInfoNotification("Added draft");
    expect(notificationStore.notifications).toEqual([
      {
        id: expect.any(String),
        message: "Added draft",
        type: NotificationType.INFO,
      },
    ]);
  });

  it("should remove notification", async () => {
    const notificationStore = useNotificationStore();
    const id1 = uuidv4();
    const id2 = uuidv4();
    notificationStore.notifications = [
      {
        id: id1,
        message: "Added draft",
        type: NotificationType.SUCCESS,
      },
      {
        id: id2,
        message: "Other msg",
        type: NotificationType.SUCCESS,
      },
    ];
    notificationStore.removeNotification(id1);
    expect(notificationStore.notifications).toEqual([
      {
        id: id2,
        message: "Other msg",
        type: NotificationType.SUCCESS,
      },
    ]);
  });
});
