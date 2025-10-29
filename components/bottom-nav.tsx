"use client"

import { Home, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-4">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 transition-colors",
            pathname === "/" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs font-medium">Feed</span>
        </Link>
        <Link
          href="/profile"
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 transition-colors",
            pathname === "/profile" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <User className="h-6 w-6" />
          <span className="text-xs font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  )
}
