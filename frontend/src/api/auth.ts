import { api } from "./client";

export type User = {
  id: number;
  email: string;
  full_name: string;
  phone?: string | null;
  job_title?: string | null;
  department?: string | null;
  employment_type: "full_time" | "part_time" | "hourly";
  role: "user" | "admin";
  is_active: boolean;
};

export type TokenOut = { access_token: string; token_type: string; user: User };

export async function login(email: string, password: string): Promise<TokenOut> {
  const { data } = await api.post<TokenOut>("/auth/login", { email, password });
  return data;
}

export async function register(payload: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  job_title?: string;
  department?: string;
  employment_type: "full_time" | "part_time" | "hourly";
}): Promise<TokenOut> {
  const { data } = await api.post<TokenOut>("/auth/register", payload);
  return data;
}

export async function me(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post("/auth/reset-password", { token, new_password: newPassword });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await api.put("/users/me/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

export async function updateMe(payload: Partial<Omit<User, "id" | "role" | "is_active" | "email">>): Promise<User> {
  const { data } = await api.put<User>("/users/me", payload);
  return data;
}
