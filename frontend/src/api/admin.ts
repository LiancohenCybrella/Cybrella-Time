import { api } from "./client";
import type { User } from "./auth";
import type { AttendanceRecord, UpdatePayload } from "./attendance";

export async function listUsers(params: {
  department?: string;
  is_active?: boolean;
} = {}): Promise<User[]> {
  const { data } = await api.get<User[]>("/admin/users", { params });
  return data;
}

export async function getUser(id: number): Promise<User> {
  const { data } = await api.get<User>(`/admin/users/${id}`);
  return data;
}

export async function updateUser(id: number, payload: Partial<User>): Promise<User> {
  const { data } = await api.put<User>(`/admin/users/${id}`, payload);
  return data;
}

export async function deactivateUser(id: number): Promise<void> {
  await api.delete(`/admin/users/${id}`);
}

export async function listAttendance(params: {
  user_id?: number;
  month?: string;
  department?: string;
  status?: string;
}): Promise<AttendanceRecord[]> {
  const { data } = await api.get<AttendanceRecord[]>("/admin/attendance", { params });
  return data;
}

export async function adminUpdateRecord(
  id: number,
  payload: UpdatePayload
): Promise<AttendanceRecord> {
  const { data } = await api.put<AttendanceRecord>(`/admin/attendance/${id}`, payload);
  return data;
}

export async function approveMonth(userId: number, month: string): Promise<void> {
  await api.post(`/admin/attendance/month/${userId}/${month}/approve`);
}

export async function rejectMonth(
  userId: number,
  month: string,
  reason?: string
): Promise<void> {
  await api.post(`/admin/attendance/month/${userId}/${month}/reject`, { reason });
}

export async function unlockMonth(userId: number, month: string): Promise<void> {
  await api.post(`/admin/attendance/month/${userId}/${month}/unlock`);
}

export async function exportMonth(month: string): Promise<Blob> {
  const resp = await api.get(`/admin/attendance/export`, {
    params: { month },
    responseType: "blob",
  });
  return resp.data as Blob;
}

export async function createHoliday(payload: {
  date: string;
  title: string;
  description?: string;
}): Promise<void> {
  await api.post("/admin/holidays", payload);
}

export async function updateHoliday(
  id: number,
  payload: { date?: string; title?: string; description?: string | null }
): Promise<void> {
  await api.put(`/admin/holidays/${id}`, payload);
}

export async function deleteHoliday(id: number): Promise<void> {
  await api.delete(`/admin/holidays/${id}`);
}
