import { prismaMock } from "../../config/prismaMock";
import { CategoryService } from "../../services/category.service";

describe("Category Service", () => {
  let categoryService: CategoryService;

  beforeEach(() => {
    categoryService = new CategoryService();
  });

  describe("createCategory", () => {
    it("should create a new category", async () => {
      const mockCategory = {
        category_id: 1,
        category_name: "Test",
        description: "Test Desc",
        parent_id: null,
        status: "Active",
        created_at: new Date(),
      };
      prismaMock.category.create.mockResolvedValue(mockCategory as any);

      const result = await categoryService.createCategory({
        category_name: "Test",
        description: "Test Desc",
      });

      expect(prismaMock.category.create).toHaveBeenCalledWith({
        data: {
          category_name: "Test",
          description: "Test Desc",
          parent_id: null,
        },
      });
      expect(result).toEqual(mockCategory);
    });
  });

  describe("getCategoryTree", () => {
    it("should return a nested category tree", async () => {
      const categories = [
        { category_id: 1, category_name: "Parent", description: null, parent_id: null, status: "Active" },
        { category_id: 2, category_name: "Child", description: null, parent_id: 1, status: "Active" },
      ] as any[];
      prismaMock.category.findMany.mockResolvedValue(categories);

      const result = await categoryService.getCategoryTree();

      expect(result).toHaveLength(1); // Only root categories
      expect(result[0]!.category_name).toBe("Parent");
      expect(result[0]!.children).toHaveLength(1);
      expect(result[0]!.children[0]!.category_name).toBe("Child");
    });
  });
});
