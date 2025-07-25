import { apiCall, API_ENDPOINTS } from "@/config/api";

export async function getRoomPresence(roomId: string): Promise<Set<string>> {
  const res = await apiCall(API_ENDPOINTS.ROOMS.PRESENCE(roomId));
  if (!res.ok) throw new Error("Failed to fetch room presence");
  const data = await res.json();
  // Convert array to Set for consistency
  return new Set(data);
}
