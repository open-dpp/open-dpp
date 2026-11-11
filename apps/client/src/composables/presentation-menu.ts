import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { authClient } from "../auth-client.ts";
import { useOrganizationsStore } from "../stores/organizations.ts";

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
  const organizationsStore = useOrganizationsStore();

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

  // Guests and members sign in on the page they came from and return to it
  function signIn() {
    router.push({
      name: "Signin",
      query: { redirect: encodeURIComponent(window.location.origin + route.fullPath) },
    });
  }

  function backToApp() {
    router.push("/");
  }

  // Signs out and comes back to this page as a visitor without a session
  function signOut() {
    router.push({
      name: "Signout",
      query: { redirect: encodeURIComponent(window.location.origin + route.fullPath) },
    });
  }

  // Without an app there is no profile in it: the one without the app structure
  function openProfile() {
    router.push({
      name: "GuestProfile",
      query: { redirect: encodeURIComponent(window.location.origin + route.fullPath) },
    });
  }

  // The app belongs to the organizations the user is a member of. A guest without any has none.
  const hasApp = computed<boolean>(() => organizationsStore.organizations.length > 0);

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
        ...(hasApp.value
          ? [
              {
                label: t("presentation.backToApp"),
                icon: "pi pi-arrow-left",
                command: () => {
                  backToApp();
                },
              },
            ]
          : []),
        ...(hasApp.value
          ? []
          : [
              {
                label: t("user.profile"),
                icon: "pi pi-user",
                command: () => {
                  openProfile();
                },
              },
            ]),
        {
          label: t("user.logout"),
          icon: "pi pi-sign-out",
          command: () => {
            signOut();
          },
        },
      ];
    }

    return [
      ...items,
      {
        label: t("auth.signin.button"),
        icon: "pi pi-sign-in",
        command: () => {
          signIn();
        },
      },
    ];
  });

  return { permalink, menuItems, navigateToAiChat };
}
