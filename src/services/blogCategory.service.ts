import prisma from "../config/prisma";

export class BlogCategoryService {
  public async getAll() {
    return await prisma.blogCategory.findMany({
      orderBy: { category_name: "asc" },
      include: { _count: { select: { blogs: true } } },
    });
  }

  public async create(data: { category_name: string; description?: string }) {
    return await prisma.blogCategory.create({
      data: {
        category_name: data.category_name,
        description: data.description ?? null,
      },
    });
  }

  public async update(id: number, data: { category_name?: string; description?: string; status?: "Active" | "Inactive" }) {
    const updateData: any = {};
    if (data.category_name !== undefined) updateData.category_name = data.category_name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;

    return await prisma.blogCategory.update({
      where: { blog_category_id: id },
      data: updateData,
    });
  }

  public async delete(id: number) {
    // Kiểm tra có blog nào đang dùng category này không
    const count = await prisma.blog.count({ where: { blog_category_id: id } });
    if (count > 0) {
      throw new Error(`Không thể xóa: Danh mục này đang có ${count} bài viết.`);
    }
    return await prisma.blogCategory.delete({ where: { blog_category_id: id } });
  }
}
