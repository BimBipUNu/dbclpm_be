import prisma from "../config/prisma";
import slugify from "slugify";
import { CreateBlogInput, UpdateBlogInput } from "../types/blog.types";

export class BlogService {
  /**
   * Tạo bài viết Blog và Dữ liệu SEO tương ứng
   */
  public async createBlog(authorId: number, data: CreateBlogInput) {
    const baseSlug = slugify(data.title, { lower: true, strict: true, locale: "vi" });
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    return await prisma.$transaction(async (tx) => {
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
          published_at: data.status === "Published" ? new Date() : null,
        },
      });

      if (data.meta_title || data.meta_description || data.meta_keywords) {
        await tx.blogSEO.create({
          data: {
            blog_id: blog.blog_id,
            meta_title: data.meta_title || data.title,
            meta_description: data.meta_description || data.summary || null,
            meta_keywords: data.meta_keywords ?? null,
            canonical_url: `https://yourdomain.com/blog/${uniqueSlug}`,
          },
        });
      }

      return blog;
    });
  }

  /**
   * Cập nhật bài viết Blog
   */
  public async updateBlog(blogId: number, data: UpdateBlogInput) {
    const existing = await prisma.blog.findUnique({ where: { blog_id: blogId } });
    if (!existing) throw new Error("Không tìm thấy bài viết.");

    return await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.blog_category_id !== undefined) updateData.blog_category_id = data.blog_category_id;
      if (data.summary !== undefined) updateData.summary = data.summary;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
      if (data.status !== undefined) {
        updateData.status = data.status;
        if (data.status === "Published" && !existing.published_at) {
          updateData.published_at = new Date();
        }
      }

      const blog = await tx.blog.update({
        where: { blog_id: blogId },
        data: updateData,
      });

      if (data.meta_title || data.meta_description || data.meta_keywords) {
        await tx.blogSEO.upsert({
          where: { blog_id: blogId },
          update: {
            meta_title: data.meta_title ?? null,
            meta_description: data.meta_description ?? null,
            meta_keywords: data.meta_keywords ?? null,
          },
          create: {
            blog_id: blogId,
            meta_title: data.meta_title || blog.title,
            meta_description: data.meta_description ?? null,
            meta_keywords: data.meta_keywords ?? null,
          },
        });
      }

      return blog;
    });
  }

  /**
   * Xóa bài viết Blog (cascade xóa SEO, Tags)
   */
  public async deleteBlog(blogId: number) {
    return await prisma.blog.delete({ where: { blog_id: blogId } });
  }

  /**
   * Lấy danh sách Blog cho Admin (Bao gồm cả Draft)
   */
  public async getAllBlogsAdmin(page: number = 1, limit: number = 10, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = status ? { status } : {};

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        include: {
          category: { select: { category_name: true } },
          author: { select: { full_name: true } },
        },
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.blog.count({ where }),
    ]);

    return { data: blogs, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Lấy chi tiết 1 Blog theo ID (Admin)
   */
  public async getBlogById(blogId: number) {
    const blog = await prisma.blog.findUnique({
      where: { blog_id: blogId },
      include: {
        seo: true,
        author: { select: { full_name: true, avatar: true } },
        category: { select: { blog_category_id: true, category_name: true } },
        tags: { include: { tag: true } },
      },
    });
    if (!blog) throw new Error("Không tìm thấy bài viết.");
    return blog;
  }

  /**
   * Lấy chi tiết Blog bằng Slug (Public)
   */
  public async getBlogBySlug(slug: string) {
    const blog = await prisma.blog.findUnique({
      where: { slug },
      include: {
        seo: true,
        author: { select: { full_name: true, avatar: true } },
        category: { select: { category_name: true } },
      },
    });
    if (!blog) throw new Error("Không tìm thấy bài viết.");
    await prisma.blog.update({ where: { blog_id: blog.blog_id }, data: { views: { increment: 1 } } });
    return blog;
  }

  /**
   * Lấy danh sách Blog (Public, chỉ Published)
   */
  public async getBlogs(page: number = 1, limit: number = 10, categoryId?: number) {
    const skip = (page - 1) * limit;
    const whereClause: any = { status: "Published" };
    if (categoryId) whereClause.blog_category_id = categoryId;

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where: whereClause,
        include: {
          category: { select: { category_name: true } },
          author: { select: { full_name: true } },
        },
        skip, take: limit, orderBy: { published_at: "desc" },
      }),
      prisma.blog.count({ where: whereClause }),
    ]);

    return { data: blogs, pagination: { total_items: total, total_pages: Math.ceil(total / limit), current_page: page } };
  }

  /**
   * Lấy danh sách Blog Categories
   */
  public async getBlogCategories() {
    return await prisma.blogCategory.findMany({ where: { status: "Active" }, orderBy: { category_name: "asc" } });
  }
}
