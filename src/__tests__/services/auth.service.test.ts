import { prismaMock } from "../../config/prismaMock";
import { registerUser, loginUser } from "../../services/auth.service";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mocked-token"),
}));

describe("Auth Service", () => {
  describe("registerUser", () => {
    it("should throw an error if email already exists", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        user_id: 1,
        email: "test@example.com",
        password: "hash",
        full_name: "Test User",
        phone: null,
        address: null,
        avatar: null,
        role: Role.Customer,
        created_at: new Date(),
        updated_at: new Date(),
      } as any);

      await expect(
        registerUser({
          email: "test@example.com",
          password: "password123",
          full_name: "Test User",
        })
      ).rejects.toThrow("Email đã được sử dụng!");
    });

    it("should register a new user successfully", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");

      const mockDate = new Date();
      prismaMock.user.create.mockResolvedValue({
        user_id: 1,
        email: "new@example.com",
        password: "hashed_password",
        full_name: "New User",
        phone: null,
        address: null,
        avatar: null,
        role: Role.Customer,
        created_at: mockDate,
        updated_at: mockDate,
      } as any);

      const result = await registerUser({
        email: "new@example.com",
        password: "password123",
        full_name: "New User",
      });

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "new@example.com",
          full_name: "New User",
        }),
      });
      expect(result).not.toHaveProperty("password");
      expect(result.email).toBe("new@example.com");
    });
  });

  describe("loginUser", () => {
    it("should throw error if user not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(loginUser("test@example.com", "pass")).rejects.toThrow(
        "Tài khoản không tồn tại!"
      );
    });

    it("should throw error if password does not match", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        user_id: 1,
        email: "test@example.com",
        password: "hash",
        full_name: "Test",
        phone: null,
        address: null,
        avatar: null,
        role: Role.Customer,
        created_at: new Date(),
        updated_at: new Date(),
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(loginUser("test@example.com", "pass")).rejects.toThrow(
        "Mật khẩu không chính xác!"
      );
    });

    it("should login successfully and return token", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        user_id: 1,
        email: "test@example.com",
        password: "hash",
        full_name: "Test User",
        phone: null,
        address: null,
        avatar: null,
        role: Role.Customer,
        created_at: new Date(),
        updated_at: new Date(),
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await loginUser("test@example.com", "pass");

      expect(result).toHaveProperty("token", "mocked-token");
      expect(result.user).not.toHaveProperty("password");
      expect(result.user.email).toBe("test@example.com");
    });
  });
});
