import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { DppStatusDto, DppStatusDtoEnum, type DppStatusDtoType } from "@open-dpp/dto";

export function useDppFilter() {
  const route = useRoute();
  const router = useRouter();
  const status = ref<DppStatusDtoType>(
    DppStatusDtoEnum.parse(route.query.status ?? DppStatusDto.Draft),
  );

  async function changeStatus(newStatus: DppStatusDtoType | undefined) {
    status.value = newStatus ?? DppStatusDto.Draft;
    await router.push({
      query: {
        ...route.query,
        status: status.value,
      },
    });
  }

  return { status, changeStatus };
}
