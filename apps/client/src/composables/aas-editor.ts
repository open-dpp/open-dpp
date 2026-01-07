import type { AasNamespace } from "@open-dpp/api-client";
import type { PagingParamsDto, SubmodelPaginationResponseDto } from "@open-dpp/dto";
import { v4 as uuid4 } from "uuid";
import { ref } from "vue";
import { usePagination } from "./pagination.ts";

export type Cursor = string | null;

export interface Page {
  from: number;
  to: number;
  itemCount: number;
  cursor: Cursor;
}

export interface PagingResult { paging_metadata: { cursor: Cursor }; result: any[] }
interface AasEditorProps { id: string; aasNamespace: AasNamespace }
export function useAasEditor({ id, aasNamespace }: AasEditorProps) {
  const submodels = ref<SubmodelPaginationResponseDto>();
  const loading = ref(false);

  const fetchSubmodels = async (pagingParams: PagingParamsDto): Promise<PagingResult> => {
    loading.value = true;
    const response = await aasNamespace.getSubmodels(id, pagingParams);
    submodels.value = response.data;
    loading.value = false;
    return response.data;
  };

  const { previousPage, nextPage, currentPage, reloadCurrentPage } = usePagination({ limit: 10, fetchCallback: fetchSubmodels });

  const createSubmodel = async () => {
    const response = await aasNamespace.createSubmodel(id, {
      idShort: uuid4(),
    });
    if (response.status === 201) {
      await reloadCurrentPage();
    }
  };

  return { submodels, nextPage, createSubmodel };
}
