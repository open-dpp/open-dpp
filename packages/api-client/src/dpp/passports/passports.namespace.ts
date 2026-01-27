import type { AxiosInstance } from 'axios'

import { AasNamespace } from '../aas/aasNamespace'

export class PassportsNamespace {
  public aas!: AasNamespace
  // private readonly passportsEndpoint = '/passports'

  constructor(
    private readonly axiosInstance: AxiosInstance,
  ) {
    this.aas = new AasNamespace(this.axiosInstance, 'passports')
  }
}
