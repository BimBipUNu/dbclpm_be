import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: Role;
  };
}

// 1. AUTHENTICATION: Kiểm tra Token hợp lệ không?
export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ message: "Không tìm thấy Token. Vui lòng đăng nhập!" });
    return;
  }

  // Cắt lấy phần token phía sau chữ "Bearer "
  const token = authHeader.split(" ")[1];

  // Nếu token bị undefined (do client gửi sai format)!
  if (!token) {
    res.status(401).json({ message: "Định dạng Token không đúng!" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
};

// 2. AUTHORIZATION: Kiểm tra Role có đủ thẩm quyền không?
export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res
        .status(403)
        .json({ message: "Bạn không có quyền thực hiện hành động này!" });
      return;
    }
    next(); // Có quyền
  };
};
