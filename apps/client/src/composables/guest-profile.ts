import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { sameOriginRedirectOf } from "../lib/login-utils.ts";

/**
 * The profile of a user who has no organization, e.g. a guest. It is opened from a page of this
 * application, which the `redirect` query names, and leads back to it.
 */
export function useGuestProfile() {
  const route = useRoute();
  const router = useRouter();

  // The query comes from a link, so it only counts if it stays on this site
  const backTarget = computed<string | undefined>(() => sameOriginRedirectOf(route.query));

  function goBack() {
    if (backTarget.value) {
      router.push(backTarget.value);
    }
  }

  // Signs out and comes back to the page the profile was opened from, as a visitor
  function signOut() {
    router.push({
      name: "Signout",
      query: backTarget.value
        ? { redirect: encodeURIComponent(window.location.origin + backTarget.value) }
        : {},
    });
  }

  return { backTarget, goBack, signOut };
}
