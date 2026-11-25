export interface VendorArtifactInfo {
  kind: 'app' | 'vendor-agent';
  version: string;
  platform: string;
  fileName: string;
  sha256: string;
  sizeBytes: number;
  downloadUrl: string;
  releaseNotes?: string[];
  publishedAt: string;
}

export interface UpdateCheckResponse {
  gatewayOnline: boolean;
  channel: string;
  currentAppVersion: string;
  latestAppVersion: string;
  hasAppUpdate: boolean;
  appUpdate: VendorArtifactInfo | null;
  currentAgentVersion: string;
  latestAgentVersion: string;
  hasVendorUpdate: boolean;
  vendorUpdate: VendorArtifactInfo | null;
  error?: string;
}
