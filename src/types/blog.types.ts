import { BlogStatus } from "@prisma/client";

export interface CreateBlogInput {
  blog_category_id: number;
  title: string;
  thumbnail?: string | undefined;
  summary?: string | undefined;
  content?: string | undefined;
  status?: BlogStatus;
  
  // SEO fields
  meta_title?: string | undefined;
  meta_description?: string | undefined;
  meta_keywords?: string | undefined;
}

export interface UpdateBlogInput extends Partial<CreateBlogInput> {
  slug?: string;
}
