"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

type MobileSidebarProps = {
  role: "ADMIN" | "FACULTY" | "STUDENT";
  user: {
    name: string;
    email: string;
  };
};

export default function MobileSidebar({ role, user }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Header user={user} onOpenMobileSidebar={() => setOpen(true)} />
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close sidebar overlay"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-[260px] max-w-[85vw]">
            <Sidebar role={role} user={user} />
          </div>
        </div>
      ) : null}
    </>
  );
}
