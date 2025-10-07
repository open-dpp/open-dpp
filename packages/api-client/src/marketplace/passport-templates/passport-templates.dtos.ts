export enum Sector {
  BATTERY = 'Battery',
  TEXTILE = 'Textile',
  ELECTRONICS = 'Electronics',
  MACHINERY = 'Machinery',
  AEROSPACE = 'Aerospace',
  CONSTRUCTION = 'Construction',
  MEDICAL = 'Medical',
  HEALTHCARE = 'Healthcare',
  EDUCATION = 'Education',
  TRADE = 'Trade',
  AGRICULTURE = 'Agriculture',
  MINING = 'Mining',
  OTHER = 'Other',
}

export interface PassportTemplateDto {
  id: string
  version: string
  name: string
  description: string
  sectors: Sector[]
  website?: string | null
  organizationName: string
  templateData: Record<string, unknown>
  ownedByOrganizationId: string
  createdByUserId: string
  contactEmail: string
  isOfficial: boolean
  createdAt: string // ISO datetime string
  updatedAt: string // ISO datetime string
  marketplaceResourceId?: string
}

export interface PassportTemplateGetAllDto
  extends Omit<PassportTemplateDto, 'templateData'> {}
