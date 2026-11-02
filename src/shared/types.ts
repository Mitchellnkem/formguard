export type SupportedField = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

export interface Draft {
  id: string;
  value: string;
  origin: string;
  pathname: string;
  fieldLabel: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export interface Settings {
  disabledOrigins: string[];
  retentionDays: number;
}

export interface FieldIdentity {
  id: string;
  origin: string;
  pathname: string;
  fieldLabel: string;
}

export interface SiteStatusMessage {
  type: "FORMGUARD_GET_STATUS";
}

export interface SetSiteEnabledMessage {
  type: "FORMGUARD_SET_SITE_ENABLED";
  enabled: boolean;
}

export type RuntimeMessage = SiteStatusMessage | SetSiteEnabledMessage;

export interface SiteStatus {
  available: boolean;
  enabled: boolean;
  origin?: string;
}
