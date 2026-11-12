import { apiClient } from "@/lib/api-client";

export type UserProfile = {
  email: string;
  name: string;
};

export async function fetchUser(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>("/users");
  return data;
}

export async function saveUserName(name: string): Promise<UserProfile> {
  const { data } = await apiClient.patch<UserProfile>("/users", { name });
  return data;
}
