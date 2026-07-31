export interface CreateCategoryInput {
  category_name: string;
  description?: string | undefined;
  parent_id?: number | undefined;
}

export interface CategoryTreeItem {
  category_id: number;
  category_name: string;
  description: string | null;
  parent_id: number | null;
  children: CategoryTreeItem[];
}
