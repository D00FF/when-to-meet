import { NextRequest, NextResponse } from "next/server";
import { User } from "../../types";
import {
  getAllUsers,
  saveUser,
  deleteUser,
  updateUserEntries,
} from "../data-store";

export async function GET() {
  try {
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user: User = await request.json();
    await saveUser(user);
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error saving user:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save user";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, userName, color } = await request.json();
    await updateUserEntries(userId, userName, color);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user entries:", error);
    return NextResponse.json(
      { error: "Failed to update user entries" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }
    await deleteUser(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

