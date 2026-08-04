import prisma from "../config/prisma";
import { CreateCategoryInput, CategoryTreeItem } from "../types/category.types";

export class CategoryService {
  public async createCategory(data: CreateCategoryInput) {
    return await prisma.category.create({
      data: {
        category_name: data.category_name,
        description: data.description ?? null,
        parent_id: data.parent_id ?? null,
      },
    });
  }

  public async getCategoryTree(): Promise<CategoryTreeItem[]> {
    const categories = await prisma.category.findMany({
      where: { status: "Active" },
      orderBy: { category_name: "asc" },
    });

    const categoryMap = new Map<number, CategoryTreeItem>();

    // Initialize all items in the map
    categories.forEach((cat: any) => {
      categoryMap.set(cat.category_id, {
        category_id: cat.category_id,
        category_name: cat.category_name,
        description: cat.description,
        parent_id: cat.parent_id,
        children: [],
      });
    });

    const rootCategories: CategoryTreeItem[] = [];

    // Build the tree
    categories.forEach((cat: any) => {
      const node = categoryMap.get(cat.category_id);
      if (!node) return;

      if (node.parent_id === null) {
        rootCategories.push(node);
      } else {
        const parentNode = categoryMap.get(node.parent_id);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          // Fallback if parent is somehow inactive or missing
          rootCategories.push(node);
        }
      }
    });

    return rootCategories;
  }

  public async updateCategory(id: number, data: Partial<CreateCategoryInput>) {
    const updateData: any = {};
    if (data.category_name !== undefined) updateData.category_name = data.category_name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.parent_id !== undefined) updateData.parent_id = data.parent_id;

    return await prisma.category.update({
      where: { category_id: id },
      data: updateData,
    });
  }

  public async deleteCategory(id: number) {
    // Check if category has children
    const children = await prisma.category.findMany({ where: { parent_id: id } });
    if (children.length > 0) {
      throw new Error("Cannot delete category with sub-categories");
    }
    
    return await prisma.category.delete({
      where: { category_id: id },
    });
  }
}
