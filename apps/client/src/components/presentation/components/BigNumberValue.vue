<script lang="ts" setup>
import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { resolveDisplayName } from "../../../composables/display-name";

const { element } = defineProps<{
  element: SubmodelElementResponseDto;
}>();

const { locale } = useI18n();

// Prefer the localized displayName; fall back to idShort (always present) so
// the card is self-captioned even for elements that were authored without a
// translated display name. The idShort keeps the card meaningful during
// template authoring.
const label = computed(() =>
  resolveDisplayName(element.displayName ?? [], locale.value, element.idShort),
);

// Format per the active locale and preserve the raw value's precision — AAS
// stores decimals with a period regardless of locale, but a German compliance
// reader expects "3,4" and "1.234.567,89" while an English reader expects
// "3.4" and "1,234,567.89". Default Intl.NumberFormat caps fraction digits at
// 3, which would silently truncate "3.14159"; we match the raw value's
// fraction-digit count to avoid that.
const formattedValue = computed(() => {
  const raw = element.value;
  if (raw === null || raw === undefined || raw === "") return "";
  const num = typeof raw === "number" ? raw : Number(raw);
  if (Number.isNaN(num)) return String(raw);

  const rawStr = String(raw);
  if (/e[+-]?\d+$/i.test(rawStr)) {
    return new Intl.NumberFormat(locale.value).format(num);
  }
  const dotIndex = rawStr.indexOf(".");
  const fractionDigits = dotIndex >= 0 ? rawStr.length - dotIndex - 1 : 0;

  return new Intl.NumberFormat(locale.value, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(num);
});
</script>

<template>
  <!--
    Card treatment. Self-captioned: the big number reads first, with the
    field's display name below as a small-caps caption. This makes the card
    meaningful on its own (e.g. in the editor's Preview column, where there is
    no surrounding `<dt>` label).
  -->
  <div
    data-cy="bignumber"
    class="border-surface-200 bg-surface-0 inline-block rounded-xl border px-5 py-4 text-center shadow-sm"
  >
    <span class="block text-4xl leading-none font-bold tracking-tight text-gray-900 tabular-nums">
      {{ formattedValue }}
    </span>
    <span class="mt-2 block text-xs font-semibold tracking-[0.08em] text-gray-500 uppercase">
      {{ label }}
    </span>
  </div>
</template>
