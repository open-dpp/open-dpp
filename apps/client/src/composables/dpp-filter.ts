import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  DigitalProductDocumentStatusDto,
  DigitalProductDocumentStatusDtoEnum,
  type DigitalProductDocumentStatusDtoType,
} from "@open-dpp/dto";

export function useDppFilter() {
  const route = useRoute();
  const router = useRouter();
  const status = ref<DigitalProductDocumentStatusDtoType>(
    DigitalProductDocumentStatusDtoEnum.parse(
      route.query.status ?? DigitalProductDocumentStatusDto.Draft,
    ),
  );

  async function changeStatus(newStatus: DigitalProductDocumentStatusDtoType | undefined) {
    status.value = newStatus ?? DigitalProductDocumentStatusDto.Draft;
    await router.push({
      query: {
        ...route.query,
        status: status.value,
      },
    });
  }

  return { status, changeStatus };
}
