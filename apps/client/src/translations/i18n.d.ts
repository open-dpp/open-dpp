import type base from "./de-DE.json";
import "vue-i18n";

type MessageSchema = typeof base;

declare module "vue-i18n" {
  // This makes `useI18n()` infer message keys globally
  export interface DefineLocaleMessage extends MessageSchema {}
}
