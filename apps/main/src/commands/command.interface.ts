export interface ICommand {
  version: string;
  getUserId(): string | undefined | null;
  toPlainForActivity(): unknown;
  createdAt: Date;
}
