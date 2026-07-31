import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number; // Trong CSDL mới, ID là số (INT)
        role: Role;
      };
    }
  }
}
