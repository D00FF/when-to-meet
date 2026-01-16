import { User, CalendarData } from "../types";

const USER_STORAGE_KEY = "when-to-meet-user";

// Local storage for current user session only (not synced)
export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function saveUserLocally(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function signOut(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_STORAGE_KEY);
}

function getWeekKey(weekStart: Date): string {
  const year = weekStart.getFullYear();
  const month = String(weekStart.getMonth() + 1).padStart(2, "0");
  const day = String(weekStart.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// API-based functions
export async function saveUser(user: User): Promise<void> {
  try {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || "Failed to save user";
      throw new Error(errorMessage);
    }
    // Also save locally for session
    saveUserLocally(user);
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
}

export async function getCalendarData(weekStart: Date): Promise<CalendarData> {
  if (typeof window === "undefined") return {};
  const weekKey = getWeekKey(weekStart);
  try {
    const response = await fetch(`/api/calendar?weekKey=${weekKey}`);
    if (!response.ok) {
      throw new Error("Failed to fetch calendar data");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    return {};
  }
}

export async function saveCalendarData(weekStart: Date, data: CalendarData): Promise<void> {
  if (typeof window === "undefined") return;
  const weekKey = getWeekKey(weekStart);
  try {
    const response = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekKey, data }),
    });
    if (!response.ok) {
      throw new Error("Failed to save calendar data");
    }
  } catch (error) {
    console.error("Error saving calendar data:", error);
    throw error;
  }
}

export async function updateCalendarSlot(
  weekStart: Date,
  day: number,
  timeIndex: number,
  userId: string,
  userName: string,
  color: string,
  isSelected: boolean
): Promise<void> {
  const weekKey = getWeekKey(weekStart);
  try {
    const response = await fetch("/api/calendar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekKey,
        day,
        timeIndex,
        userId,
        userName,
        color,
        isSelected,
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to update calendar slot");
    }
  } catch (error) {
    console.error("Error updating calendar slot:", error);
    throw error;
  }
}

export async function updateUserEntries(
  userId: string,
  userName: string,
  color: string
): Promise<void> {
  try {
    const response = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, userName, color }),
    });
    if (!response.ok) {
      throw new Error("Failed to update user entries");
    }
  } catch (error) {
    console.error("Error updating user entries:", error);
    throw error;
  }
}

export async function getAllSavedUsers(): Promise<User[]> {
  if (typeof window === "undefined") return [];
  try {
    const response = await fetch("/api/users");
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function addUserToSaved(user: User): Promise<void> {
  await saveUser(user);
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    const response = await fetch(`/api/users?userId=${userId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete user");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

export async function findUserByName(name: string): Promise<User | null> {
  const savedUsers = await getAllSavedUsers();
  const trimmedName = name.trim().toLowerCase();
  return savedUsers.find((u) => u.name.trim().toLowerCase() === trimmedName) || null;
}

