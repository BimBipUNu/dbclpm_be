export interface RegisterUserInput {
  email: string;
  password?: string; // Tùy chọn vì có thể truyền từ req.body nhưng service sẽ hash
  full_name: string;
  phone?: string;
  address?: string;
  avatar?: string;
}

export interface AuthResponse {
  message: string;
  data?: any;
}
