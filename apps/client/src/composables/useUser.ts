import type { UserDto } from "@open-dpp/api-client";
import { ref } from "vue";
import apiClient from "../lib/api-client";

export function useUser() {
  const user = ref<UserDto | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchUser = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await apiClient.dpp.users.getById(id);
      user.value = data;
    }
    catch (e: any) {
      error.value = e.message || "Failed to fetch user";
    }
    finally {
      loading.value = false;
    }
  };

  return {
    user,
    loading,
    error,
    fetchUser,
  };
}
