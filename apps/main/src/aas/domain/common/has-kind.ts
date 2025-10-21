export enum ModellingKind {
  Template = "Template",
  Instance = "Instance",
}

export interface IHasKind {
  kind: ModellingKind | null;
}
