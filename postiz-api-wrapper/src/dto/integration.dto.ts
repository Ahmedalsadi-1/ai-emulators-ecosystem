export interface IntegrationDto {
  id: string;
  platform: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  followerCount?: number;
  profileUrl?: string;
}

export interface ConnectIntegrationDto {
  platform: string;
  code?: string;
  state?: string;
  redirectUri?: string;
}

export interface IntegrationResponseDto {
  integrations: IntegrationDto[];
  total: number;
}

export interface PlatformConfigDto {
  platform: string;
  authUrl: string;
  scopes: string[];
  features: string[];
}