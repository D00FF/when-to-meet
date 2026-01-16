"use client";

import { useEffect, useState } from "react";
import { getAllSavedUsers } from "../utils/storage";
import { User } from "../types";

export default function Legend() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const updateUsers = async () => {
      try {
        const savedUsers = await getAllSavedUsers();
        setUsers(savedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    updateUsers();

    // Update periodically to catch new users
    const interval = setInterval(updateUsers, 2000);
    return () => clearInterval(interval);
  }, []);

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="bg-white backdrop-blur-xl rounded-xl p-4 border border-zinc-200 shadow-lg">
      <h3 className="text-sm font-semibold mb-3 text-zinc-900">Participants</h3>
      <div className="flex flex-wrap gap-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white backdrop-blur-sm border border-zinc-200"
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: user.color }}
            />
            <span className="text-sm text-zinc-700 font-medium">
              {user.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

