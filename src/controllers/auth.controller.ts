import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { RegisterUserInput, AuthResponse } from "../types/auth.types";

export const register = async (req: Request<{}, {}, RegisterUserInput>, res: Response<AuthResponse>): Promise<void> => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({ message: "Đăng ký thành công", data: user });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response<AuthResponse>): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.status(200).json({ message: "Đăng nhập thành công", data: result });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};
