import { User, CalendarData } from "../types";
import { createClient } from "redis";

const USERS_KEY = "when-to-meet:users";
const CALENDAR_KEY = "when-to-meet:calendar";

// Initialize Redis client (reused across serverless invocations)
let redisClient: ReturnType<typeof createClient> | null = null;
let isConnecting = false;

async function getRedisClient() {
  // Return existing connected client
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL environment variable is not set. Please configure your Redis database.");
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    // Wait a bit and retry
    await new Promise(resolve => setTimeout(resolve, 100));
    return getRedisClient();
  }

  isConnecting = true;

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            return new Error("Too many reconnection attempts");
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    await redisClient.connect();
    return redisClient;
  } finally {
    isConnecting = false;
  }
}

// Helper to check if Redis is configured
function isRedisConfigured(): boolean {
  return !!process.env.REDIS_URL;
}

// Users operations
export async function getAllUsers(): Promise<User[]> {
  if (!isRedisConfigured()) {
    throw new Error("Database not configured. Please set up Redis in your project settings.");
  }
  try {
    const client = await getRedisClient();
    const data = await client.get(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error fetching users from Redis:", error);
    throw error;
  }
}

export async function saveUser(user: User): Promise<void> {
  if (!isRedisConfigured()) {
    throw new Error("Database not configured. Please set up Redis in your project settings.");
  }
  try {
    const users = await getAllUsers();
    const existingIndex = users.findIndex((u) => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    const client = await getRedisClient();
    await client.set(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Error saving user to Redis:", error);
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<void> {
  if (!isRedisConfigured()) {
    throw new Error("Database not configured. Please set up Redis in your project settings.");
  }
  try {
    const users = await getAllUsers();
    const filtered = users.filter((u) => u.id !== userId);
    const client = await getRedisClient();
    await client.set(USERS_KEY, JSON.stringify(filtered));
    
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
    await client.set(CALENDAR_KEY, JSON.stringify(calendarData));
  } catch (error) {
    console.error("Error deleting user from Redis:", error);
    throw error;
  }
}

// Calendar operations
export async function getAllCalendarData(): Promise<Record<string, CalendarData>> {
  if (!isRedisConfigured()) {
    return {};
  }
  try {
    const client = await getRedisClient();
    const data = await client.get(CALENDAR_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Error fetching calendar data from Redis:", error);
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
  if (!isRedisConfigured()) {
    throw new Error("Database not configured. Please set up Redis in your project settings.");
  }
  try {
    const allData = await getAllCalendarData();
    allData[weekKey] = data;
    const client = await getRedisClient();
    await client.set(CALENDAR_KEY, JSON.stringify(allData));
  } catch (error) {
    console.error("Error saving calendar data to Redis:", error);
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
  if (!isRedisConfigured()) {
    throw new Error("Database not configured. Please set up Redis in your project settings.");
  }
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
      const client = await getRedisClient();
      await client.set(CALENDAR_KEY, JSON.stringify(allData));
    }
  } catch (error) {
    console.error("Error updating user entries in Redis:", error);
    throw error;
  }
}
