import { useRoute, useRouter } from "vue-router";

export function useRouterUtils() {
  const route = useRoute();
  const router = useRouter();
  const goToParent = async () => {
    const segments = route.path.split("/").filter(Boolean);
    segments.pop(); // remove last part

    const parentPath = "/" + segments.join("/");
    await router.push(parentPath || "/");
  };
  return { goToParent };
}
