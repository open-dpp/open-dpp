export type BaseEmailType = "VERIFY_EMAIL";

export interface BaseEmailCreateProps {
  type: BaseEmailType;
  template: string;
  to: string;
  subject: string;
  templateProperties: string;
}

export class BaseEmail {
  public readonly id: string;
  public readonly type: BaseEmailType;
  public readonly template: string;
  public readonly to: string;
  public readonly subject: string;
  public readonly templateProperties: any;

  constructor(
    id: string,
    type: BaseEmailType,
    template: string,
    to: string,
    subject: string,
    templateProperties: any,
  ) {
    this.id = id;
    this.type = type;
    this.template = template;
    this.to = to;
    this.subject = subject;
    this.templateProperties = templateProperties;
  }
}
