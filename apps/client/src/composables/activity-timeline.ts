import { useI18n } from "vue-i18n";
import {
  type ActivityDto,
  DataTypeDefEnum,
  type ExtendedJsonPatchDtoOperation,
  type KeyDto,
  KeyTypes,
  KeyTypesEnum,
  OperationDtoTypes,
  ReferenceJsonSchema,
  SubmodelOperationDtoTypes,
} from "@open-dpp/dto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { match, P } from "ts-pattern";
import { formatPropertyValue } from "../lib/property-value.ts";
import { convertLocaleToLanguage } from "../translations/i18n.ts";
import { z } from "zod";
import { getVisualType } from "../lib/aas-editor.ts";

dayjs.extend(utc);
type TimelineContentType = { value: string; renderContentAsFile?: boolean };

export type TimelineItem = {
  id: string;
  timestamp: string;
  title: string;
  content: TimelineContentType[];
  icon: string;
};

export function useActivityTimeline() {
  const { t, locale } = useI18n();
  const replaceIcon = "pi pi-user-edit";
  const addIcon = "pi pi-plus";
  const removeIcon = "pi pi-trash";

  const rowTrans = t("aasEditor.table.row");
  const colTrans = t("aasEditor.table.column");
  const positionTrans = t("activityHistory.position");
  const valueAttr = t("aasEditor.formLabels.value");

  function createTranslations(activity: ActivityDto, change: ExtendedJsonPatchDtoOperation) {
    const id = activity.header.id;
    const timestamp = dayjs(activity.header.createdAt).format("LLL");
    const operation = t(`activityHistory.operations.${change.op}`);
    const nameAttr = t("aasEditor.formLabels.name");
    return { id, timestamp, operation, valueAttr, nameAttr };
  }

  function createTitle(attribute: string, operation: string) {
    return `${attribute} ${operation}`;
  }

  function createSubmodelBaseMatcher(
    activity: ActivityDto,
    change: ExtendedJsonPatchDtoOperation,
    isSubmodel: boolean = false,
  ) {
    const { id, timestamp, operation, nameAttr } = createTranslations(activity, change);
    const SubmodelBaseModification = isSubmodel
      ? SubmodelOperationDtoTypes.SubmodelModified
      : P.union(
          SubmodelOperationDtoTypes.SubmodelValueModified,
          SubmodelOperationDtoTypes.SubmodelElementValueModified,
          SubmodelOperationDtoTypes.SubmodelElementModified,
        );
    const containsDisplayName = P.string.includes("/displayName/");
    const containsDisplayNameText = P.string.regex("\\/displayName\\/\\d+\\/text$");

    return match({ activity, change })
      .returnType<TimelineItem | undefined>()
      .with(
        {
          change: {
            op: OperationDtoTypes.Remove,
            path: containsDisplayName,
          },
          activity: {
            payload: {
              command: {
                op: SubmodelBaseModification,
              },
            },
          },
        },
        () => ({
          id,
          timestamp,
          title: createTitle(nameAttr, operation),
          content: [],
          icon: removeIcon,
        }),
      )
      .with(
        {
          change: {
            op: OperationDtoTypes.Add,
            path: containsDisplayName,
          },
          activity: {
            payload: {
              command: {
                op: SubmodelBaseModification,
              },
            },
          },
        },
        () => ({
          id,
          timestamp,
          title: createTitle(nameAttr, operation),
          content: [{ value: change.value.text }],
          icon: addIcon,
        }),
      )
      .with(
        {
          change: {
            op: OperationDtoTypes.Replace,
            path: containsDisplayNameText,
          },
          activity: {
            payload: {
              command: {
                op: SubmodelBaseModification,
              },
              changes: P.array(
                P.not({ op: OperationDtoTypes.Remove, path: P.string.includes("/displayName/") }),
              ),
            },
          },
        },
        () => {
          return {
            id,
            timestamp,
            title: createTitle(nameAttr, operation),
            content: [{ value: change.value }],
            icon: replaceIcon,
          };
        },
      );
  }

  function createContent(key: string, value: string) {
    return `${key}: ${value}`;
  }

  function createTimelineItemForSubmodel(
    activity: ActivityDto,
    change: ExtendedJsonPatchDtoOperation,
  ) {
    const { id, timestamp, operation } = createTranslations(activity, change);

    const submodelBaseMatcher = createSubmodelBaseMatcher(activity, change, true);
    const dppMatcher = {
      m: P.string.select("modelType"),
    };

    return submodelBaseMatcher
      .with(
        {
          activity: {
            payload: { command: { op: SubmodelOperationDtoTypes.SubmodelElementAdded } },
          },
          change: {
            dpp: dppMatcher,
            op: OperationDtoTypes.Add,
          },
        },
        ({ modelType }) => {
          const valueType = change.dpp?.v;
          const visualType = getVisualType(
            KeyTypesEnum.parse(modelType),
            DataTypeDefEnum.optional().parse(valueType),
            t,
          );
          return {
            id,
            timestamp,
            title: createTitle(visualType, operation),
            content: [],
            icon: addIcon,
          };
        },
      )
      .with(
        {
          activity: {
            payload: {
              command: {
                op: SubmodelOperationDtoTypes.SubmodelElementDeleted,
              },
            },
          },
          change: {
            dpp: dppMatcher,
            op: OperationDtoTypes.Remove,
          },
        },
        ({ modelType }) => {
          const valueType = change.dpp?.v;
          const visualType = getVisualType(
            KeyTypesEnum.parse(modelType),
            DataTypeDefEnum.optional().parse(valueType),
            t,
          );
          return {
            id,
            timestamp,
            title: createTitle(visualType, operation),
            content: [],
            icon: removeIcon,
          };
        },
      )
      .otherwise(() => undefined);
  }

  function createTimelineItemForProperty(
    activity: ActivityDto,
    change: ExtendedJsonPatchDtoOperation,
  ): TimelineItem | undefined {
    const { id, timestamp, operation, valueAttr } = createTranslations(activity, change);

    const submodelBaseMatcher = createSubmodelBaseMatcher(activity, change);
    return submodelBaseMatcher
      .with(
        {
          change: { path: P.string.endsWith("value"), dpp: { m: KeyTypes.Property } },
        },
        () => ({
          id,
          timestamp,
          title: createTitle(valueAttr, operation),
          content: createContentFromChange(change),
          icon: replaceIcon,
        }),
      )
      .otherwise(() => undefined);
  }

  function createContentFromChange(change: ExtendedJsonPatchDtoOperation) {
    return match(change)
      .returnType<TimelineContentType[]>()
      .with(
        {
          path: P.string.endsWith("value"),
          dpp: { m: KeyTypes.Property, v: P.select() },
        },
        (v) => [
          {
            value: createContent(
              valueAttr,
              formatPropertyValue(
                change.value,
                DataTypeDefEnum.parse(v),
                convertLocaleToLanguage(locale.value),
              ),
            ),
          },
        ],
      )
      .with(
        {
          path: P.string.endsWith("value"),
          dpp: { m: KeyTypes.File },
        },
        () => [
          {
            value: change.value,
            renderContentAsFile: true,
          },
        ],
      )
      .with(
        {
          dpp: { m: KeyTypes.ReferenceElement },
        },
        () => {
          const parsedResult = ReferenceJsonSchema.safeParse(change.value);
          const value = parsedResult.success
            ? parsedResult.data.keys.find((key: KeyDto) => key.type === KeyTypes.GlobalReference)
                ?.value
            : change.value;

          return [
            {
              value: createContent(valueAttr, value),
            },
          ];
        },
      )
      .otherwise(() => []);
  }

  function createTimelineItemForFile(activity: ActivityDto, change: ExtendedJsonPatchDtoOperation) {
    const { id, timestamp, operation, valueAttr } = createTranslations(activity, change);

    const submodelBaseMatcher = createSubmodelBaseMatcher(activity, change);

    return submodelBaseMatcher
      .with(
        {
          change: {
            op: OperationDtoTypes.Replace,
            path: P.string.endsWith("value"),
            dpp: { m: KeyTypes.File },
          },
        },
        () => ({
          content: createContentFromChange(change),
          id,
          timestamp,
          title: createTitle(valueAttr, operation),
          icon: replaceIcon,
        }),
      )
      .otherwise(() => undefined);
  }

  function createTimelineItemForReferenceElement(
    activity: ActivityDto,
    change: ExtendedJsonPatchDtoOperation,
  ): TimelineItem | undefined {
    const { id, timestamp, operation, valueAttr } = createTranslations(activity, change);

    const submodelBaseMatcher = createSubmodelBaseMatcher(activity, change);

    function formatValue(value: any) {
      const parsedResult = ReferenceJsonSchema.safeParse(value);
      if (parsedResult.success) {
        return parsedResult.data.keys.find((key: KeyDto) => key.type === KeyTypes.GlobalReference)
          ?.value;
      } else if (z.string().safeParse(value).success) {
        return value;
      }
      return undefined;
    }

    return submodelBaseMatcher
      .with(
        {
          change: { path: P.string.endsWith("value"), dpp: { m: KeyTypes.ReferenceElement } },
        },
        () => ({
          content: [{ value: createContent(valueAttr, formatValue(change.value)) }],
          id,
          timestamp,
          title: createTitle(valueAttr, operation),
          icon: replaceIcon,
        }),
      )
      .otherwise(() => undefined);
  }

  function getNumberPartsFromPath(path: string) {
    const regex = /\/(?<number>\d+)(?=\/|$)/g;

    return [...path.matchAll(regex)].map((match) => match.groups?.number);
  }

  function cellPositionAsContentFromPath(change: ExtendedJsonPatchDtoOperation) {
    const numbers = getNumberPartsFromPath(change.path);
    return [
      { value: createContent(rowTrans, `${Number(numbers[numbers.length - 2]) + 1}`) },
      {
        value: createContent(
          colTrans,
          `${Number(numbers[numbers.length - 1]) + 1} (${change.dpp?.p?.split(".").pop() ?? ""})`,
        ),
      },
    ];
  }

  function createTimelineItemForList(activity: ActivityDto, change: ExtendedJsonPatchDtoOperation) {
    const { id, timestamp, operation, valueAttr } = createTranslations(activity, change);
    const submodelBaseMatcher = createSubmodelBaseMatcher(activity, change);
    return submodelBaseMatcher
      .with(
        {
          change: {
            op: OperationDtoTypes.Add,
          },
          activity: {
            payload: {
              command: {
                op: SubmodelOperationDtoTypes.SubmodelRowAdded,
                value: { pos: P.number.select() },
              },
            },
          },
        },
        (pos) => ({
          id,
          timestamp,
          title: createTitle(rowTrans, operation),
          icon: addIcon,
          content: [{ value: createContent(positionTrans, z.coerce.string().parse(pos + 1)) }],
        }),
      )
      .with(
        {
          change: {
            op: OperationDtoTypes.Remove,
          },
          activity: {
            payload: {
              command: {
                op: SubmodelOperationDtoTypes.SubmodelRowDeleted,
                value: { pos: P.number.select() },
              },
            },
          },
        },
        (pos) => ({
          id,
          timestamp,
          title: createTitle(rowTrans, operation),
          icon: removeIcon,
          content: [{ value: createContent(positionTrans, z.coerce.string().parse(pos + 1)) }],
        }),
      )
      .with(
        {
          activity: {
            payload: {
              command: {
                op: SubmodelOperationDtoTypes.SubmodelColumnDeleted,
                value: { pos: P.number.select() },
              },
            },
          },
          change: {
            op: OperationDtoTypes.Remove,
            path: P.string.regex("\\/value\\/0\\/value\\/\\d+$"),
          },
        },
        (pos) => ({
          id,
          timestamp,
          title: createTitle(colTrans, operation),
          icon: removeIcon,
          content: [{ value: createContent(positionTrans, z.coerce.string().parse(pos + 1)) }],
        }),
      )
      .with(
        {
          activity: {
            payload: {
              command: {
                op: SubmodelOperationDtoTypes.SubmodelColumnAdded,
                value: { pos: P.number.select() },
              },
            },
          },
          change: {
            op: OperationDtoTypes.Add,
            path: P.string.regex("\\/value\\/0\\/value\\/\\d+$"),
          },
        },
        (pos) => ({
          id,
          timestamp,
          title: createTitle(colTrans, operation),
          icon: addIcon,
          content: [{ value: createContent(positionTrans, z.coerce.string().parse(pos + 1)) }],
        }),
      )
      .with(
        {
          activity: {
            payload: {
              command: {
                op: P.union(
                  SubmodelOperationDtoTypes.SubmodelValueModified,
                  SubmodelOperationDtoTypes.SubmodelElementValueModified,
                  SubmodelOperationDtoTypes.SubmodelElementModified,
                ),
              },
            },
          },
          change: { op: OperationDtoTypes.Replace, path: P.string.endsWith("value") },
        },
        () => {
          return {
            id,
            timestamp,
            title: createTitle(valueAttr, operation),
            icon: replaceIcon,
            content: [...cellPositionAsContentFromPath(change), ...createContentFromChange(change)],
          };
        },
      )
      .otherwise(() => undefined);
  }

  return {
    createTimelineItemForProperty,
    createTimelineItemForReferenceElement,
    createTimelineItemForFile,
    createTimelineItemForList,
    createTimelineItemForSubmodel,
  };
}
