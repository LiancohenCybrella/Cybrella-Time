import { api } from "./client";

export type DayType =
  | "work"
  | "vacation"
  | "sick"
  | "reserve"
  | "holiday"
  | "other_absence";

export type RecordStatus = "draft" | "submitted" | "approved" | "rejected";
export type ApprovalStatus = "submitted" | "approved" | "rejected";

export type AttendanceRecord = {
  id: number;
  user_id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  day_type: DayType;
  note: string | null;
  status: RecordStatus;
  total_hours: number | null;
  created_at: string;
  updated_at: string | null;
};

export type MonthSummary = {
  month: string;
  work_days: number;
  vacation_days: number;
  sick_days: number;
  reserve_days: number;
  holiday_days: number;
  other_absence_days: number;
  total_hours: number;
  submitted: boolean;
  approved: boolean;
  locked: boolean;
};

export type MonthAttendance = {
  records: AttendanceRecord[];
  summary: MonthSummary;
  approval_status: ApprovalStatus | null;
};

export type CreatePayload = {
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  day_type: DayType;
  note?: string | null;
};

export type UpdatePayload = Partial<CreatePayload>;

export async function getMyMonth(month: string): Promise<MonthAttendance> {
  const { data } = await api.get<MonthAttendance>(`/attendance/my`, { params: { month } });
  return data;
}

export async function createRecord(payload: CreatePayload): Promise<AttendanceRecord> {
  const { data } = await api.post<AttendanceRecord>("/attendance", payload);
  return data;
}

export async function updateRecord(
  id: number,
  payload: UpdatePayload
): Promise<AttendanceRecord> {
  const { data } = await api.put<AttendanceRecord>(`/attendance/${id}`, payload);
  return data;
}

export async function deleteRecord(id: number): Promise<void> {
  await api.delete(`/attendance/${id}`);
}

export async function submitMonth(month: string): Promise<MonthAttendance> {
  const { data } = await api.post<MonthAttendance>(`/attendance/month/${month}/submit`);
  return data;
}
