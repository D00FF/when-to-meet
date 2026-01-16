import { User, CalendarData } from "../types";

const USER_STORAGE_KEY = "when-to-meet-user";
const CALENDAR_STORAGE_KEY = "when-to-meet-calendar";
const SAVED_USERS_KEY = "when-to-meet-saved-users";

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function saveUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function getWeekKey(weekStart: Date): string {
  const year = weekStart.getFullYear();
  const month = String(weekStart.getMonth() + 1).padStart(2, "0");
  const day = String(weekStart.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCalendarData(weekStart: Date): CalendarData {
  if (typeof window === "undefined") return {};
  const weekKey = getWeekKey(weekStart);
  const stored = localStorage.getItem(CALENDAR_STORAGE_KEY);
  if (!stored) return {};
  const allData = JSON.parse(stored);
  return allData[weekKey] || {};
}

export function saveCalendarData(weekStart: Date, data: CalendarData): void {
  if (typeof window === "undefined") return;
  const weekKey = getWeekKey(weekStart);
  const stored = localStorage.getItem(CALENDAR_STORAGE_KEY);
  const allData = stored ? JSON.parse(stored) : {};
  allData[weekKey] = data;
  localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(allData));
}

export function updateCalendarSlot(weekStart: Date, day: number, timeIndex: number, userId: string, userName: string, color: string, isSelected: boolean): void {
  const calendarData = getCalendarData(weekStart);
  const key = `${day}-${timeIndex}`;
  
  if (isSelected) {
    // Add user to slot if not already present
    if (!calendarData[key]) {
      calendarData[key] = [];
    }
    const exists = calendarData[key].some(entry => entry.userId === userId);
    if (!exists) {
      calendarData[key].push({ userId, userName, color });
    } else {
      // Update existing entry with new name/color
      const index = calendarData[key].findIndex(entry => entry.userId === userId);
      if (index !== -1) {
        calendarData[key][index] = { userId, userName, color };
      }
    }
  } else {
    // Remove user from slot
    if (calendarData[key]) {
      calendarData[key] = calendarData[key].filter(entry => entry.userId !== userId);
      if (calendarData[key].length === 0) {
        delete calendarData[key];
      }
    }
  }
  
  saveCalendarData(weekStart, calendarData);
}

export function updateUserEntries(userId: string, userName: string, color: string): void {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(CALENDAR_STORAGE_KEY);
  if (!stored) return;
  const allData = JSON.parse(stored);
  let updated = false;
  
  // Update user entries across all weeks
  Object.keys(allData).forEach((weekKey) => {
    const calendarData = allData[weekKey];
    Object.keys(calendarData).forEach((slotKey) => {
      const entries = calendarData[slotKey];
      const userIndex = entries.findIndex((entry: any) => entry.userId === userId);
      if (userIndex !== -1) {
        entries[userIndex] = { userId, userName, color };
        updated = true;
      }
    });
  });
  
  if (updated) {
    localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(allData));
  }
  
  // Also update saved users list
  const savedUsers = getAllSavedUsers();
  const userIndex = savedUsers.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    savedUsers[userIndex] = { id: userId, name: userName, color };
    saveAllUsers(savedUsers);
  }
}

export function getAllSavedUsers(): User[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(SAVED_USERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveAllUsers(users: User[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVED_USERS_KEY, JSON.stringify(users));
}

export function addUserToSaved(user: User): void {
  const savedUsers = getAllSavedUsers();
  const exists = savedUsers.some(u => u.id === user.id);
  if (!exists) {
    savedUsers.push(user);
    saveAllUsers(savedUsers);
  } else {
    // Update existing user
    const index = savedUsers.findIndex(u => u.id === user.id);
    if (index !== -1) {
      savedUsers[index] = user;
      saveAllUsers(savedUsers);
    }
  }
}

export function deleteUser(userId: string): void {
  if (typeof window === "undefined") return;
  
  // Remove from saved users
  const savedUsers = getAllSavedUsers();
  const filtered = savedUsers.filter(u => u.id !== userId);
  saveAllUsers(filtered);
  
  // Remove all entries from all weeks
  const stored = localStorage.getItem(CALENDAR_STORAGE_KEY);
  if (!stored) return;
  const allData = JSON.parse(stored);
  
  Object.keys(allData).forEach((weekKey) => {
    const calendarData = allData[weekKey];
    Object.keys(calendarData).forEach((slotKey) => {
      const entries = calendarData[slotKey];
      const filteredEntries = entries.filter((entry: any) => entry.userId !== userId);
      if (filteredEntries.length === 0) {
        delete calendarData[slotKey];
      } else {
        calendarData[slotKey] = filteredEntries;
      }
    });
  });
  
  localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(allData));
}

export function signOut(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function findUserByName(name: string): User | null {
  const savedUsers = getAllSavedUsers();
  const trimmedName = name.trim().toLowerCase();
  return savedUsers.find(u => u.name.trim().toLowerCase() === trimmedName) || null;
}

