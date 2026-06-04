"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Medal, School, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/meets", label: "大会", icon: CalendarDays },
  { href: "/results", label: "結果", icon: Medal },
  { href: "/universities", label: "大学", icon: School },
  { href: "/athletes", label: "選手", icon: UserRound }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/96 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-soft md:hidden">
      <div className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-bold text-slate-600 hover:bg-field hover:text-sash-red",
                active && "text-sash-red"
              )}
            >
              <Icon size={20} fill={active ? "currentColor" : "none"} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
