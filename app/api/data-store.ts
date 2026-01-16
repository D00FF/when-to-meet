import { User, CalendarData } from "../types";
import { kv } from "@vercel/kv";

const USERS_KEY = "when-to-meet:users";
const CALENDAR_KEY = "when-to-meet:calendar";

// Helper to check if KV is configured
function isKVConfigured(): boolean {
  return !!(
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  );
}

// Users operations
export async function getAllUsers(): Promise<User[]> {
  if (!isKVConfigured()) {
    console.error("Vercel KV is not configured. Please set up KV in your Vercel dashboard.");
    throw new Error("Database not configured. Please set up Vercel KV in your project settings.");
  }
  try {
    const data = await kv.get<User[]>(USERS_KEY);
    return data || [];
  } catch (error) {
    console.error("Error fetching users from KV:", error);
    throw error;
  }
}

export async function saveUser(user: User): Promise<void> {
  if (!isKVConfigured()) {
    console.error("Vercel KV is not configured. Please set up KV in your Vercel dashboard.");
    throw new Error("Database not configured. Please set up Vercel KV in your project settings.");
  }
  try {
    const users = await getAllUsers();
    const existingIndex = users.findIndex((u) => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    await kv.set(USERS_KEY, users);
  } catch (error) {
    console.error("Error saving user to KV:", error);
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    const users = await getAllUsers();
    const filtered = users.filter((u) => u.id !== userId);
    await kv.set(USERS_KEY, filtered);
    
    // Also remove from calendar data
    const calendarData = await getAllCalendarData();
    Object.keys(calendarData).forEach((weekKey) => {
      const weekData = calendarData[weekKey];
      Object.keys(weekData).forEach((slotKey) => {
        weekData[slotKey] = weekData[slotKey].filter(
          (entry) => entry.userId !== userId
        );
        if (weekData[slotKey].length === 0) {
          delete weekData[slotKey];
        }
      });
    });
    await kv.set(CALENDAR_KEY, calendarData);
  } catch (error) {
    console.error("Error deleting user from KV:", error);
    throw error;
  }
}

// Calendar operations
export async function getAllCalendarData(): Promise<Record<string, CalendarData>> {
  if (!isKVConfigured()) {
    console.error("Vercel KV is not configured. Please set up KV in your Vercel dashboard.");
    return {};
  }
  try {
    const data = await kv.get<Record<string, CalendarData>>(CALENDAR_KEY);
    return data || {};
  } catch (error) {
    console.error("Error fetching calendar data from KV:", error);
    return {};
  }
}

export async function getCalendarData(weekKey: string): Promise<CalendarData> {
  const allData = await getAllCalendarData();
  return allData[weekKey] || {};
}

export async function saveCalendarData(
  weekKey: string,
  data: CalendarData
): Promise<void> {
  if (!isKVConfigured()) {
    console.error("Vercel KV is not configured. Please set up KV in your Vercel dashboard.");
    throw new Error("Database not configured. Please set up Vercel KV in your project settings.");
  }
  try {
    const allData = await getAllCalendarData();
    allData[weekKey] = data;
    await kv.set(CALENDAR_KEY, allData);
  } catch (error) {
    console.error("Error saving calendar data to KV:", error);
    throw error;
  }
}

export async function updateCalendarSlot(
  weekKey: string,
  day: number,
  timeIndex: number,
  userId: string,
  userName: string,
  color: string,
  isSelected: boolean
): Promise<void> {
  const calendarData = await getCalendarData(weekKey);
  const key = `${day}-${timeIndex}`;

  if (isSelected) {
    if (!calendarData[key]) {
      calendarData[key] = [];
    }
    const exists = calendarData[key].some((entry) => entry.userId === userId);
    if (!exists) {
      calendarData[key].push({ userId, userName, color });
    } else {
      const index = calendarData[key].findIndex(
        (entry) => entry.userId === userId
      );
      if (index !== -1) {
        calendarData[key][index] = { userId, userName, color };
      }
    }
  } else {
    if (calendarData[key]) {
      calendarData[key] = calendarData[key].filter(
        (entry) => entry.userId !== userId
      );
      if (calendarData[key].length === 0) {
        delete calendarData[key];
      }
    }
  }

  await saveCalendarData(weekKey, calendarData);
}

export async function updateUserEntries(
  userId: string,
  userName: string,
  color: string
): Promise<void> {
  try {
    const allData = await getAllCalendarData();
    let updated = false;

    Object.keys(allData).forEach((weekKey) => {
      const calendarData = allData[weekKey];
      Object.keys(calendarData).forEach((slotKey) => {
        const entries = calendarData[slotKey];
        const userIndex = entries.findIndex((entry) => entry.userId === userId);
        if (userIndex !== -1) {
          entries[userIndex] = { userId, userName, color };
          updated = true;
        }
      });
    });

    if (updated) {
      await kv.set(CALENDAR_KEY, allData);
    }
  } catch (error) {
    console.error("Error updating user entries in KV:", error);
    throw error;
  }
}

