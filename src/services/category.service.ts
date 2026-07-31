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
    categories.forEach((cat) => {
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
    categories.forEach((cat) => {
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
}
