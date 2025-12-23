export interface AnalyticsQueryDto {
  platforms?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  metrics?: string[];
}

export interface AnalyticsResponseDto {
  platform: string;
  followers: number;
  engagement: number;
  reach: number;
  impressions: number;
  posts: number;
  date: string;
}

export interface AnalyticsSummaryDto {
  totalFollowers: number;
  totalEngagement: number;
  totalReach: number;
  totalImpressions: number;
  totalPosts: number;
  growthRate: number;
  topPerformingPosts: Array<{
    id: string;
    content: string;
    engagement: number;
    reach: number;
  }>;
}