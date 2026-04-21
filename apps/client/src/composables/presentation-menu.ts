import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { authClient } from "../auth-client.ts";

export interface PresentationMenuItem {
  readonly label: string;
  readonly icon: string;
  readonly command: () => void;
}

export function usePresentationMenu() {
  const { t } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const session = authClient.useSession();

  const permalink = computed(() => String(route.params.permalink ?? ""));

  const isSignedIn = computed<boolean>(() => {
    return session.value?.data != null;
  });

  function navigateToPassportView() {
    router.push(`/p/${permalink.value}`);
  }

  function navigateToAiChat() {
    router.push(`/p/${permalink.value}/chat`);
  }

  function backToApp() {
    router.push("/");
  }

  const menuItems = computed<PresentationMenuItem[]>(() => {
    const items: PresentationMenuItem[] = [
      {
        label: t("presentation.toPass"),
        icon: "pi pi-home",
        command: () => {
          navigateToPassportView();
        },
      },
      {
        label: t("presentation.chatWithAI"),
        icon: "pi pi-comments",
        command: () => {
          navigateToAiChat();
        },
      },
    ];

    if (isSignedIn.value) {
      return [
        ...items,
        {
          label: t("presentation.backToApp"),
          icon: "pi pi-arrow-left",
          command: () => {
            backToApp();
          },
        },
      ];
    }

    return items;
  });

  return { permalink, menuItems, navigateToAiChat };
}
