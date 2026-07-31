import prisma from "../config/prisma";
import slugify from "slugify";
import { CreateBlogInput, UpdateBlogInput } from "../types/blog.types";

export class BlogService {
  /**
   * Tạo bài viết Blog và Dữ liệu SEO tương ứng
   */
  public async createBlog(authorId: number, data: CreateBlogInput) {
    // Tự động sinh Slug từ Title
    const baseSlug = slugify(data.title, { lower: true, strict: true, locale: "vi" });
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`; // Chống trùng lặp slug

    return await prisma.$transaction(async (tx) => {
      // 1. Tạo Blog
      const blog = await tx.blog.create({
        data: {
          author_id: authorId,
          blog_category_id: data.blog_category_id,
          title: data.title,
          slug: uniqueSlug,
          summary: data.summary ?? null,
          content: data.content ?? null,
          thumbnail: data.thumbnail ?? null,
          status: data.status || "Draft",
        },
      });

      // 2. Tạo BlogSEO
      if (data.meta_title || data.meta_description || data.meta_keywords) {
        await tx.blogSEO.create({
          data: {
            blog_id: blog.blog_id,
            meta_title: data.meta_title || data.title, // Fallback
            meta_description: data.meta_description || data.summary || null, // Fallback
            meta_keywords: data.meta_keywords ?? null,
            canonical_url: `https://yourdomain.com/blog/${uniqueSlug}`,
          },
        });
      }

      return blog;
    });
  }

  /**
   * Lấy chi tiết Blog bằng Slug (Dành cho SEO - Kèm theo thẻ Meta)
   */
  public async getBlogBySlug(slug: string) {
    const blog = await prisma.blog.findUnique({
      where: { slug: slug },
      include: {
        seo: true,
        author: { select: { full_name: true, avatar: true } },
        category: { select: { category_name: true } },
      },
    });

    if (!blog) throw new Error("Không tìm thấy bài viết.");
    
    // Tăng lượt view (Có thể tách riêng API tăng view để tránh block)
    await prisma.blog.update({
      where: { blog_id: blog.blog_id },
      data: { views: { increment: 1 } }
    });

    return blog;
  }

  /**
   * Lấy danh sách Blog (Phân trang)
   */
  public async getBlogs(page: number = 1, limit: number = 10, categoryId?: number) {
    const skip = (page - 1) * limit;

    const whereClause: any = {
      status: "Published",
    };

    if (categoryId) {
      whereClause.blog_category_id = categoryId;
    }

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where: whereClause,
        include: {
          category: { select: { category_name: true } },
          author: { select: { full_name: true } }
        },
        skip,
        take: limit,
        orderBy: { published_at: "desc" },
      }),
      prisma.blog.count({ where: whereClause }),
    ]);

    return {
      data: blogs,
      pagination: {
        total_items: total,
        total_pages: Math.ceil(total / limit),
        current_page: page,
      },
    };
  }
}
