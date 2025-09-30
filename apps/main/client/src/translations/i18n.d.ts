import 'vue-i18n';
import base from './de-DE.json';

type MessageSchema = typeof base;

declare module 'vue-i18n' {
  // This makes `useI18n()` infer message keys globally
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefineLocaleMessage extends MessageSchema {}
}
