import { NextRequest, NextResponse } from "next/server";
import { CalendarData } from "../../types";
import {
  getAllCalendarData,
  getCalendarData,
  saveCalendarData,
  updateCalendarSlot,
} from "../data-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekKey = searchParams.get("weekKey");

    if (weekKey) {
      const data = await getCalendarData(weekKey);
      return NextResponse.json(data);
    } else {
      const allData = await getAllCalendarData();
      return NextResponse.json(allData);
    }
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { weekKey, data } = await request.json();
    if (!weekKey || !data) {
      return NextResponse.json(
        { error: "weekKey and data are required" },
        { status: 400 }
      );
    }
    await saveCalendarData(weekKey, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving calendar data:", error);
    return NextResponse.json(
      { error: "Failed to save calendar data" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const {
      weekKey,
      day,
      timeIndex,
      userId,
      userName,
      color,
      isSelected,
    } = await request.json();

    if (
      weekKey === undefined ||
      day === undefined ||
      timeIndex === undefined ||
      !userId ||
      !userName ||
      !color ||
      isSelected === undefined
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    await updateCalendarSlot(
      weekKey,
      day,
      timeIndex,
      userId,
      userName,
      color,
      isSelected
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating calendar slot:", error);
    return NextResponse.json(
      { error: "Failed to update calendar slot" },
      { status: 500 }
    );
  }
}

