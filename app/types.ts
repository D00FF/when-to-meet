export interface User {
  id: string;
  name: string;
  color: string;
}

export interface TimeSlot {
  day: number; // 0 = Sunday, 6 = Saturday
  timeIndex: number; // 0-17 (8am-5pm in 30min intervals)
}

export interface SlotEntry {
  userId: string;
  userName: string;
  color: string;
}

export interface CalendarData {
  [key: string]: SlotEntry[]; // key format: "day-timeIndex" e.g., "0-0" for Sunday 8am
}

export const COLOR_OPTIONS = [
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
];

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const startHour = 8 + Math.floor(i / 2);
  const startMinute = i % 2 === 0 ? 0 : 30;
  const endHour = 8 + Math.floor((i + 1) / 2);
  const endMinute = (i + 1) % 2 === 0 ? 0 : 30;
  
  const formatTime = (hour: number, minute: number) => {
    return `${hour}:${minute.toString().padStart(2, "0")}`;
  };
  
  return `${formatTime(startHour, startMinute)} - ${formatTime(endHour, endMinute)}`;
});

