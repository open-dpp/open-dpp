import type { UserDto } from "@open-dpp/api-client";
import { ref } from "vue";
import apiClient from "../lib/api-client";
import { useErrorHandlingStore } from "../stores/error.handling";
import { i18n } from "../translations/i18n";

export function useUser() {
  const user = ref<UserDto | null>(null);
  const loading = ref(false);
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = i18n.global;

  const fetchUser = async (id: string) => {
    loading.value = true;
    try {
      const { data } = await apiClient.dpp.users.getById(id);
      user.value = data;
    }
    catch (e: unknown) {
      errorHandlingStore.logErrorWithNotification(t("notifications.error"), e);
    }
    finally {
      loading.value = false;
    }
  };

  return {
    user,
    loading,
    fetchUser,
  };
}
