import { User, CalendarData } from "../types";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const CALENDAR_FILE = path.join(DATA_DIR, "calendar.json");

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists or other error
  }
}

// Initialize files if they don't exist
async function initFiles() {
  await ensureDataDir();
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify([]), "utf-8");
  }
  try {
    await fs.access(CALENDAR_FILE);
  } catch {
    await fs.writeFile(CALENDAR_FILE, JSON.stringify({}), "utf-8");
  }
}

// Users operations
export async function getAllUsers(): Promise<User[]> {
  await initFiles();
  try {
    const data = await fs.readFile(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveUser(user: User): Promise<void> {
  await initFiles();
  const users = await getAllUsers();
  const existingIndex = users.findIndex((u) => u.id === user.id);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export async function deleteUser(userId: string): Promise<void> {
  await initFiles();
  const users = await getAllUsers();
  const filtered = users.filter((u) => u.id !== userId);
  await fs.writeFile(USERS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  
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
  await fs.writeFile(
    CALENDAR_FILE,
    JSON.stringify(calendarData, null, 2),
    "utf-8"
  );
}

// Calendar operations
export async function getAllCalendarData(): Promise<Record<string, CalendarData>> {
  await initFiles();
  try {
    const data = await fs.readFile(CALENDAR_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
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
  await initFiles();
  const allData = await getAllCalendarData();
  allData[weekKey] = data;
  await fs.writeFile(
    CALENDAR_FILE,
    JSON.stringify(allData, null, 2),
    "utf-8"
  );
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
    await fs.writeFile(
      CALENDAR_FILE,
      JSON.stringify(allData, null, 2),
      "utf-8"
    );
  }
}

