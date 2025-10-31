import { LinkIcon } from "@heroicons/vue/16/solid";
import { ListBulletIcon } from "@heroicons/vue/20/solid";
import { ChartBarSquareIcon, PaperClipIcon } from "@heroicons/vue/24/outline";
import { DataFieldType } from "@open-dpp/api-client";

export const DraftDataFieldVisualization = {
  [DataFieldType.TEXT_FIELD]: {
    icon: ListBulletIcon,
    background: "bg-pink-500",
    label: "draft.textField",
  },
  [DataFieldType.PRODUCT_PASSPORT_LINK]: {
    icon: LinkIcon,
    background: "bg-green-500",
    label: "draft.passportLink",
  },
  [DataFieldType.NUMERIC_FIELD]: { icon: ChartBarSquareIcon, background: "bg-teal-500", label: "draft.numberField" },
  [DataFieldType.FILE_FIELD]: {
    icon: PaperClipIcon,
    background: "bg-orange-500",
    label: "draft.fileField",
  },
};
