"use client";

import { useState, useEffect } from "react";
import { User, COLOR_OPTIONS } from "../types";
import { getUser, saveUser, updateUserEntries, addUserToSaved, deleteUser, findUserByName } from "../utils/storage";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: (user: User | null) => void;
  onDelete?: () => void;
}

export default function UserProfileModal({ isOpen, onClose, onDelete }: UserProfileModalProps) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existingUser = getUser();
      if (existingUser) {
        setName(existingUser.name);
        setSelectedColor(existingUser.color);
        setIsEditing(true);
      } else {
        setName("");
        setSelectedColor(COLOR_OPTIONS[0].value);
        setIsEditing(false);
      }
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    const currentLoggedInUser = getUser();
    const trimmedName = name.trim();
    
    // If not editing an existing profile, check if a user with this name exists
    if (!currentLoggedInUser) {
      const existingUserByName = findUserByName(trimmedName);
      if (existingUserByName) {
        // Log in to existing profile
        saveUser(existingUserByName);
        onClose(existingUserByName);
        setError("");
        return;
      }
    }

    // Create new user or update existing
    const user: User = currentLoggedInUser ? {
      ...currentLoggedInUser,
      name: trimmedName,
      color: selectedColor,
    } : {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: trimmedName,
      color: selectedColor,
    };

    saveUser(user);
    addUserToSaved(user); // Add to saved users list
    
    // Update all existing calendar entries if user already exists
    if (currentLoggedInUser) {
      updateUserEntries(user.id, user.name, user.color);
    }
    
    onClose(user);
    setError("");
  };

  const handleDelete = () => {
    const existingUser = getUser();
    if (existingUser && window.confirm(`Are you sure you want to delete your profile? This will remove all your entries from all weeks.`)) {
      deleteUser(existingUser.id);
      localStorage.removeItem("when-to-meet-user"); // Clear current user
      if (onDelete) {
        onDelete();
      }
      onClose(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-white backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-200 p-8">
        <h2 className="text-2xl font-semibold mb-6 text-zinc-900">
          {isEditing ? "Edit Your Profile" : "Create Your Profile"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-zinc-700">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-lg bg-white backdrop-blur-sm border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-zinc-900 placeholder-zinc-400 transition-all"
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-zinc-700">
              Choose Your Color
            </label>
            <div className="grid grid-cols-5 gap-3">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-full aspect-square rounded-lg transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50 ${
                    selectedColor === color.value
                      ? "ring-4 ring-offset-2 ring-zinc-400 dark:ring-zinc-500 scale-110"
                      : "hover:ring-2 hover:ring-zinc-300 dark:hover:ring-zinc-600"
                  }`}
                  style={{ backgroundColor: color.value }}
                  aria-label={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              className="w-full py-3 px-6 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/30"
            >
              Save Profile
            </button>
            {getUser() && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-3 px-6 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/30"
              >
                Delete Profile
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

