import { defineStore } from "pinia";
import { ref } from "vue";

interface Profile {
  name: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const useProfileStore = defineStore("profile", () => {
  const profile = ref<Profile>();
  const setProfile = (newProfile: Profile) => {
    profile.value = newProfile;
  };
  return { profile, setProfile };
});
