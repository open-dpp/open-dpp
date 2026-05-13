<script lang="ts" setup>
import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { resolveDisplayName } from "../../../composables/display-name";

const { element } = defineProps<{
  element: SubmodelElementResponseDto;
}>();

const { locale } = useI18n();

const label = computed(() =>
  resolveDisplayName(element.displayName ?? [], locale.value, element.idShort),
);

const formattedValue = computed(() => {
  const raw = element.value;
  if (raw === null || raw === undefined || raw === "") return "";

  if (typeof raw === "number") {
    if (Number.isNaN(raw)) return String(raw);
    const rawStr = String(raw);
    const dotIndex = rawStr.indexOf(".");
    const fractionDigits = dotIndex >= 0 ? rawStr.length - dotIndex - 1 : 0;
    return new Intl.NumberFormat(locale.value, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(raw);
  }

  if (typeof raw !== "string") return String(raw);

  const decimalMatch = raw.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  if (decimalMatch) {
    const [, sign, intPart, fracPart] = decimalMatch;
    const formattedInt = new Intl.NumberFormat(locale.value).format(BigInt(`${sign}${intPart}`));
    if (fracPart === undefined) return formattedInt;
    const decimalSeparator =
      new Intl.NumberFormat(locale.value).formatToParts(0.1).find((p) => p.type === "decimal")
        ?.value ?? ".";
    return `${formattedInt}${decimalSeparator}${fracPart}`;
  }

  const num = Number(raw);
  if (Number.isNaN(num)) return raw;
  return new Intl.NumberFormat(locale.value).format(num);
});
</script>

<template>
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
