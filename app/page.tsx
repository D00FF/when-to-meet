"use client";

import { useState, useEffect } from "react";
import { User } from "./types";
import { getUser, signOut } from "./utils/storage";
import UserProfileModal from "./components/UserProfileModal";
import Calendar from "./components/Calendar";
import Legend from "./components/Legend";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (user) {
      setCurrentUser(user);
    } else {
      setShowModal(true);
    }
  }, []);

  const handleUserSet = (user: User | null) => {
    if (user) {
      setCurrentUser(user);
      setShowModal(false);
    } else {
      // User was deleted
      setCurrentUser(null);
      setShowModal(true);
    }
  };

  const handleEditProfile = () => {
    setShowModal(true);
  };

  const handleUserDeleted = () => {
    setCurrentUser(null);
    setShowModal(true);
  };

  const handleSignOut = () => {
    signOut();
    setCurrentUser(null);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-zinc-900">
              Availability
            </h1>
            {currentUser && (
              <div className="flex gap-2">
                <button
                  onClick={handleEditProfile}
                  className="px-4 py-2 rounded-lg bg-white backdrop-blur-sm border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-all transform hover:scale-105"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-lg bg-white backdrop-blur-sm border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-all transform hover:scale-105"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
          <p className="text-zinc-600">
            Click and drag timeslots to select your lab availability
          </p>
        </header>

        {/* Legend */}
        <div className="mb-6">
          <Legend />
        </div>

        {/* Calendar */}
        {currentUser ? (
          <div className="bg-white backdrop-blur-xl rounded-2xl p-6 border border-zinc-200 shadow-lg">
            <Calendar currentUser={currentUser} />
          </div>
        ) : (
          <div className="bg-white backdrop-blur-xl rounded-2xl p-12 border border-zinc-200 shadow-lg text-center">
            <p className="text-zinc-600">Loading...</p>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      <UserProfileModal isOpen={showModal} onClose={handleUserSet} onDelete={handleUserDeleted} />
    </div>
  );
}
