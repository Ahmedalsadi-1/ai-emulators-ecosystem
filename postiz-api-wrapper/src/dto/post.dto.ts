export interface CreatePostDto {
  content: string;
  platforms: string[];
  scheduledAt?: string;
  media?: MediaDto[];
  tags?: string[];
  aiEnhance?: boolean;
}

export interface UpdatePostDto {
  content?: string;
  platforms?: string[];
  scheduledAt?: string;
  media?: MediaDto[];
  tags?: string[];
}

export interface MediaDto {
  url: string;
  type: 'image' | 'video';
  alt?: string;
}

export interface PostResponseDto {
  id: string;
  content: string;
  platforms: string[];
  scheduledAt: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  media?: MediaDto[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PostsListResponseDto {
  posts: PostResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}