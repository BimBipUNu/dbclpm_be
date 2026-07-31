import { prismaMock } from "../../config/prismaMock";
import { BlogService } from "../../services/blog.service";

describe("Blog Service", () => {
  let blogService: BlogService;

  beforeEach(() => {
    blogService = new BlogService();
  });

  describe("createBlog", () => {
    it("should create a blog and its SEO data", async () => {
      const mockBlog = {
        blog_id: 1,
        author_id: 1,
        blog_category_id: 1,
        title: "Test Blog",
        slug: "test-blog-1234",
        summary: "Summary",
        content: "Content",
        thumbnail: null,
        status: "Draft",
        views: 0,
        published_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      prismaMock.$transaction.mockImplementation(async (callback) => {
        return await callback(prismaMock as any);
      });

      prismaMock.blog.create.mockResolvedValue(mockBlog as any);
      prismaMock.blogSEO.create.mockResolvedValue({} as any);

      const result = await blogService.createBlog(1, {
        title: "Test Blog",
        blog_category_id: 1,
        summary: "Summary",
        content: "Content",
        meta_title: "SEO Title",
      });

      expect(prismaMock.blog.create).toHaveBeenCalled();
      expect(prismaMock.blogSEO.create).toHaveBeenCalled();
      expect(result.blog_id).toBe(1);
    });
  });

  describe("getBlogBySlug", () => {
    it("should throw error if blog not found", async () => {
      prismaMock.blog.findUnique.mockResolvedValue(null);
      await expect(blogService.getBlogBySlug("not-exist")).rejects.toThrow("Không tìm thấy bài viết.");
    });

    it("should return blog and increment views", async () => {
      const mockBlog = { blog_id: 1, slug: "test" } as any;
      prismaMock.blog.findUnique.mockResolvedValue(mockBlog);
      prismaMock.blog.update.mockResolvedValue({} as any);

      const result = await blogService.getBlogBySlug("test");

      expect(prismaMock.blog.update).toHaveBeenCalledWith({
        where: { blog_id: 1 },
        data: { views: { increment: 1 } },
      });
      expect(result).toEqual(mockBlog);
    });
  });

  describe("getBlogs", () => {
    it("should return paginated blogs", async () => {
      prismaMock.blog.findMany.mockResolvedValue([{ blog_id: 1, title: "Test" } as any]);
      prismaMock.blog.count.mockResolvedValue(1);

      const result = await blogService.getBlogs(1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total_items).toBe(1);
      expect(result.pagination.current_page).toBe(1);
    });
  });
});
