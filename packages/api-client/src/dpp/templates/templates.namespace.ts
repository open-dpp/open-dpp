import type { AxiosInstance } from 'axios'
import { AasNamespace } from '../aas/aasNamespace'

export class TemplatesNamespace {
  public aas!: AasNamespace

  constructor(
    private readonly axiosInstance: AxiosInstance,
  ) {
    this.aas = new AasNamespace(this.axiosInstance, 'templates')
  }
}
