import { computed } from "vue";
import { useAasUtils } from "./aas-utils";
import type { LanguageTextDto } from "@open-dpp/dto";

export function useDisplayName(options: LanguageTextDto[]) {

  const parseDisplayName = computed(() => {
    const { parseDisplayName } = useAasUtils();
    return parseDisplayName;
  });

  return computed(() => parseDisplayName.value(options));
}
