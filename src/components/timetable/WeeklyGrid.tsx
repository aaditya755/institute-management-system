"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";

type WeeklySlot = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  batch?: {
    name: string;
  };
  faculty?: {
    user?: {
      name: string;
    };
  };
};

type WeeklyGridProps = {
  slots: WeeklySlot[];
  editable?: boolean;
  onAddSlot?: (day: string, slotLabel?: string) => void;
  onEditSlot?: (slot: WeeklySlot) => void;
  onDeleteSlot?: (slot: WeeklySlot) => void;
};

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WeeklyGrid({
  slots,
  editable = false,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
}: WeeklyGridProps) {
  const timeSlots = Array.from(new Set(slots.map((item) => `${item.startTime}-${item.endTime}`)));

  return (
    <Card>
      <CardContent className="overflow-x-auto p-5">
        <div className="grid min-w-[900px] grid-cols-7 gap-3">
          <div className="rounded-2xl border border-brand-border bg-brand-dark p-4 text-sm font-medium text-brand-muted">
            Time
          </div>
          {weekDays.map((day) => (
            <div
              key={day}
              className="rounded-2xl border border-brand-border bg-brand-dark p-4 text-center text-sm font-medium text-white"
            >
              {day}
            </div>
          ))}

          {timeSlots.map((slotLabel) => {
            const [startTime, endTime] = slotLabel.split("-");
            return (
              <div key={slotLabel} className="contents">
                <div className="rounded-2xl border border-brand-border bg-white/[0.02] p-4 text-sm text-brand-muted">
                  {formatTime(startTime)}
                  <br />
                  <span className="text-xs">{formatTime(endTime)}</span>
                </div>
                {weekDays.map((day) => {
                  const slot = slots.find(
                    (item) =>
                      item.day === day &&
                      item.startTime === startTime &&
                      item.endTime === endTime,
                  );

                  return (
                    <div key={`${slotLabel}-${day}`} className="min-h-32 rounded-2xl border border-brand-border bg-white/[0.02] p-3">
                      {slot ? (
                        <div className="h-full rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3">
                          <p className="font-medium text-white">{slot.subject}</p>
                          <p className="mt-1 text-xs text-brand-muted">
                            {slot.faculty?.user?.name ?? slot.batch?.name ?? ""}
                          </p>
                          <p className="mt-3 text-xs text-brand-muted">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </p>
                          {editable ? (
                            <div className="mt-3 flex gap-2">
                              <Button type="button" variant="secondary" size="icon" onClick={() => onEditSlot?.(slot)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="hover:border-red-500 hover:text-red-300"
                                onClick={() => onDeleteSlot?.(slot)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ) : editable ? (
                        <button
                          type="button"
                          className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-brand-border text-brand-muted transition hover:border-violet-500 hover:text-white"
                          onClick={() => onAddSlot?.(day, slotLabel)}
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
