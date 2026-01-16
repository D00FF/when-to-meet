"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, CalendarData, DAYS, TIME_SLOTS, SlotEntry } from "../types";
import { getCalendarData, updateCalendarSlot } from "../utils/storage";
import { getInitials } from "../utils/helpers";
import { getWeekStart, getWeekDates, getMonthName, getDayNumber, addWeeks, getWeekRangeText } from "../utils/dateUtils";

interface CalendarProps {
  currentUser: User;
}

export default function Calendar({ currentUser }: CalendarProps) {
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number; timeIndex: number } | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [dragAction, setDragAction] = useState<"select" | "deselect" | null>(null);
  const dragRef = useRef(false);
  const calendarDataRef = useRef<CalendarData>({});
  
  // Week navigation state - initialize to current week
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const weekDates = getWeekDates(currentWeekStart);
  const weekRangeText = getWeekRangeText(currentWeekStart);

  useEffect(() => {
    // Load calendar data for current week
    const loadWeekData = async () => {
      try {
        const data = await getCalendarData(currentWeekStart);
        setCalendarData(data);
        calendarDataRef.current = data;
      } catch (error) {
        console.error("Error loading calendar data:", error);
      }
    };

    loadWeekData();
    
    // Poll for changes from other users
    const interval = setInterval(() => {
      loadWeekData();
    }, 2000); // Poll every 2 seconds

    return () => {
      clearInterval(interval);
    };
  }, [currentWeekStart]);

  const getSlotKey = (day: number, timeIndex: number) => `${day}-${timeIndex}`;

  const isSlotSelected = (day: number, timeIndex: number) => {
    const key = getSlotKey(day, timeIndex);
    const slot = calendarDataRef.current[key];
    return slot?.some(entry => entry.userId === currentUser.id) || false;
  };

  const handleMouseDown = (day: number, timeIndex: number) => {
    setIsDragging(true);
    setDragStart({ day, timeIndex });
    dragRef.current = true;
    
    const wasSelected = isSlotSelected(day, timeIndex);
    const action = wasSelected ? "deselect" : "select";
    setDragAction(action);
    
    const newSelected = new Set<string>();
    newSelected.add(getSlotKey(day, timeIndex));
    
    setSelectedSlots(newSelected);
    // Don't update immediately - wait for mouse up to apply changes
  };

  const handleMouseEnter = (day: number, timeIndex: number) => {
    if (!isDragging || !dragStart) return;

    const newSelected = new Set<string>();
    const startDay = Math.min(dragStart.day, day);
    const endDay = Math.max(dragStart.day, day);
    const startTime = Math.min(dragStart.timeIndex, timeIndex);
    const endTime = Math.max(dragStart.timeIndex, timeIndex);

    for (let d = startDay; d <= endDay; d++) {
      for (let t = startTime; t <= endTime; t++) {
        newSelected.add(getSlotKey(d, t));
      }
    }

    setSelectedSlots(newSelected);
  };

  const handleMouseUp = useRef<() => void>(() => {});

  useEffect(() => {
    handleMouseUp.current = async () => {
      if (!dragStart || !dragAction) {
        setIsDragging(false);
        setDragStart(null);
        setDragAction(null);
        setSelectedSlots(new Set());
        dragRef.current = false;
        return;
      }

      // Apply the same action (select or deselect) to all slots in the selection
      const slotsToUpdate = Array.from(selectedSlots);
      const updatePromises = slotsToUpdate.map((key) => {
        const [day, timeIndex] = key.split("-").map(Number);
        const shouldSelect = dragAction === "select";
        return updateCalendarSlot(currentWeekStart, day, timeIndex, currentUser.id, currentUser.name, currentUser.color, shouldSelect);
      });

      try {
        await Promise.all(updatePromises);
        // Refresh calendar data after updates
        const updated = await getCalendarData(currentWeekStart);
        setCalendarData(updated);
        calendarDataRef.current = updated;
      } catch (error) {
        console.error("Error updating calendar slots:", error);
      }

      setIsDragging(false);
      setDragStart(null);
      setDragAction(null);
      setSelectedSlots(new Set());
      dragRef.current = false;
    };
  }, [isDragging, selectedSlots, dragStart, dragAction, currentUser, currentWeekStart]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragRef.current) {
        handleMouseUp.current();
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const getSlotStyle = (day: number, timeIndex: number) => {
    const key = getSlotKey(day, timeIndex);
    const slot = calendarData[key];
    const isUserSelected = slot?.some(entry => entry.userId === currentUser.id) || false;
    const isInDragSelection = selectedSlots.has(key);
    const willBeSelected = isInDragSelection && dragAction === "select";
    const willBeDeselected = isInDragSelection && dragAction === "deselect";

    // During drag, show preview state
    if (isInDragSelection && isDragging) {
      if (willBeSelected) {
        return {
          backgroundColor: `${currentUser.color}40`,
          borderColor: currentUser.color,
          borderLeftWidth: "4px",
        };
      } else if (willBeDeselected) {
        return {
          backgroundColor: "transparent",
          borderColor: "rgba(0,0,0,0.1)",
        };
      }
    }

    if (!slot || slot.length === 0) {
      return {
        backgroundColor: "transparent",
        borderColor: isUserSelected ? currentUser.color : "rgba(0,0,0,0.1)",
      };
    }

    if (slot.length === 1) {
      return {
        backgroundColor: `${slot[0].color}40`,
        borderColor: slot[0].color,
        borderLeftWidth: "4px",
      };
    }

    // Multiple users - create horizontal gradient with distinct sections
    const colors = slot.map(entry => entry.color);
    const numColors = colors.length;
    const gradientStops: string[] = [];
    const borderGradientStops: string[] = [];
    
    colors.forEach((color, idx) => {
      const startPercent = (idx / numColors) * 100;
      const endPercent = ((idx + 1) / numColors) * 100;
      gradientStops.push(`${color}50 ${startPercent}%`);
      gradientStops.push(`${color}50 ${endPercent}%`);
      borderGradientStops.push(`${color} ${startPercent}%`);
      borderGradientStops.push(`${color} ${endPercent}%`);
    });
    
    // Return style with gradient border info - we'll handle the border in the JSX
    return {
      background: `linear-gradient(to right, ${gradientStops.join(", ")})`,
      borderColor: "transparent", // Will be overridden by wrapper
      borderLeftWidth: "4px",
      position: "relative" as const,
      borderGradient: `linear-gradient(to right, ${borderGradientStops.join(", ")})`,
      hasMultipleUsers: true,
    } as any;
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, -1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  return (
    <div className="w-full">
      {/* Week Navigation Bar */}
      <div className="mb-4 bg-white rounded-lg p-4 border border-zinc-200">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousWeek}
            className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
            aria-label="Previous week"
          >
            <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-xl font-semibold text-zinc-900">{weekRangeText}</div>
          
          <button
            onClick={handleNextWeek}
            className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
            aria-label="Next week"
          >
            <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid grid-cols-8 gap-x-2 gap-y-0">
            {/* Time column header */}
            <div className="sticky left-0 z-10 bg-white backdrop-blur-sm rounded-lg p-2 border border-zinc-200">
              <div className="text-xs font-medium text-zinc-500 text-center">Time</div>
            </div>

            {/* Day headers */}
            {weekDates.map((date, idx) => (
              <div
                key={idx}
                className="bg-white backdrop-blur-sm rounded-lg p-2 border border-zinc-200 text-center"
              >
                <div className="text-sm font-semibold text-zinc-900">{getDayNumber(date)}</div>
                <div className="text-xs text-zinc-500">{DAYS[idx].slice(0, 3).toUpperCase()}</div>
              </div>
            ))}

            {/* Time slots */}
            {TIME_SLOTS.flatMap((time, timeIndex) => {
              const timeCell = (
                <div
                  key={`time-${timeIndex}`}
                  className="sticky left-0 z-10 bg-white backdrop-blur-sm rounded-lg p-1.5 border border-zinc-200 flex items-center justify-center"
                >
                  <span className="text-[10px] text-zinc-600 whitespace-nowrap">{time}</span>
                </div>
              );
              
              const dayCells = DAYS.map((_, day) => {
                const slotKey = getSlotKey(day, timeIndex);
                const slot = calendarData[slotKey];
                const slotStyle = getSlotStyle(day, timeIndex);
                // Show preview during drag
                const isInDragSelection = selectedSlots.has(slotKey);
                const showPreview = isDragging && isInDragSelection && dragAction === "select";
                const isFirstSlot = timeIndex === 0;
                
                const hasMultipleUsers = (slotStyle as any).hasMultipleUsers;
                const borderGradient = (slotStyle as any).borderGradient;
                const baseStyle = { ...slotStyle };
                if (hasMultipleUsers) {
                  delete (baseStyle as any).hasMultipleUsers;
                  delete (baseStyle as any).borderGradient;
                }
                
                return (
                  <div
                    key={`${day}-${timeIndex}`}
                    className={`min-h-[28px] border-2 transition-all cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center ${
                      isFirstSlot ? 'rounded-t-lg border-t-2' : 'rounded-none border-t-0'
                    } ${timeIndex === TIME_SLOTS.length - 1 ? 'rounded-b-lg border-b-2' : ''}`}
                    style={hasMultipleUsers ? {
                      ...baseStyle,
                      borderImage: `${borderGradient} 1`,
                      borderStyle: "solid",
                    } : slotStyle}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleMouseDown(day, timeIndex);
                    }}
                    onMouseEnter={() => handleMouseEnter(day, timeIndex)}
                    onMouseUp={() => handleMouseUp.current()}
                  >
                    {(slot && slot.length > 0) || showPreview ? (
                      <div className="flex items-center gap-0.5 justify-center w-full px-1">
                        {showPreview && (!slot || slot.length === 0) ? (
                          <div
                            className="rounded-full bg-white border-2 flex items-center justify-center text-[10px] font-semibold text-zinc-700 flex-shrink-0"
                            style={{ 
                              borderColor: currentUser.color,
                              width: slot && slot.length > 3 ? `${100 / (slot.length + 1)}%` : '24px',
                              height: slot && slot.length > 3 ? `${100 / (slot.length + 1)}%` : '24px',
                              minWidth: '16px',
                              minHeight: '16px',
                              fontSize: slot && slot.length > 3 ? '8px' : '10px'
                            }}
                          >
                            {getInitials(currentUser.name)}
                          </div>
                        ) : slot && slot.length > 0 ? (
                          slot.map((entry, entryIdx) => {
                            const iconSize = slot.length > 3 ? `${100 / slot.length}%` : '24px';
                            const fontSize = slot.length > 3 ? '8px' : slot.length === 3 ? '9px' : '10px';
                            return (
                              <div
                                key={entryIdx}
                                className="rounded-full bg-white border-2 flex items-center justify-center font-semibold text-zinc-700 flex-shrink"
                                style={{ 
                                  borderColor: entry.color,
                                  width: iconSize,
                                  height: iconSize,
                                  minWidth: '16px',
                                  minHeight: '16px',
                                  fontSize: fontSize
                                }}
                              >
                                {getInitials(entry.userName)}
                              </div>
                            );
                          })
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              });
              
              return [timeCell, ...dayCells];
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

