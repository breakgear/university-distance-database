"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { SashStripes } from "./SashStripes";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/meets", label: "大会" },
  { href: "/results", label: "結果" },
  { href: "/universities", label: "大学" },
  { href: "/athletes", label: "選手" }
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/94 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-3 sm:h-[72px]">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-red-100 bg-white text-lg font-black text-sash-red shadow-sm sm:h-10 sm:w-10 sm:text-xl">走</span>
            <span className="leading-tight">
              <span className="block truncate text-base font-black text-ink sm:text-xl">大学長距離データベース</span>
              <span className="hidden text-xs font-bold text-slate-500 sm:block">非公式プロトタイプ</span>
            </span>
          </Link>
          <div className="hidden md:block">
            <SashStripes compact />
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-bold text-slate-600 hover:bg-field hover:text-sash-red",
                    active && "bg-red-50 text-sash-red"
                  )}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link
            aria-label="探す"
            className={cn(
              "hidden h-10 w-10 items-center justify-center rounded-full border border-red-100 text-sash-red hover:bg-field md:flex",
              pathname.startsWith("/search") && "bg-red-50"
            )}
            href="/search"
          >
            <Search size={18} />
          </Link>
          <div className="flex items-center text-sash-red md:hidden">
            <Link aria-label="探す" href="/search" className={cn("grid h-11 w-11 place-items-center rounded-full", pathname.startsWith("/search") && "bg-red-50")}>
              <Search size={24} />
            </Link>
          </div>
        </div>
        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none md:hidden" aria-label="主要ナビゲーション">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                className={cn(
                  "min-h-9 shrink-0 rounded-full border px-4 py-2 text-xs font-black text-slate-600",
                  active ? "border-sash-red bg-red-50 text-sash-red" : "border-line bg-field"
                )}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
