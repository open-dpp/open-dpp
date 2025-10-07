import { createI18n } from "vue-i18n";
import deDE from "./de-DE.json";
import enUS from "./en-US.json";

export type MessageSchema = typeof deDE;

export const i18n = createI18n<[MessageSchema], "en-US" | "de-DE">({
  legacy: false,
  locale: "de-DE",
  fallbackLocale: "en-US",
  messages: {
    "en-US": enUS,
    "de-DE": deDE,
  },
});
