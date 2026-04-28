import { api } from "./client";

export type Holiday = {
  id: number;
  date: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
};

export async function listHolidays(month?: string): Promise<Holiday[]> {
  const { data } = await api.get<Holiday[]>("/holidays", {
    params: month ? { month } : {},
  });
  return data;
}
