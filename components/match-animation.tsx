"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart } from "lucide-react"
import type { UserProfile } from "@/lib/mock-data"

interface MatchAnimationProps {
  userProfile: UserProfile
  onComplete: () => void
}

export function MatchAnimation({ userProfile, onComplete }: MatchAnimationProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setShow(true), 100)

    // Auto-close after 3 seconds
    const timer = setTimeout(() => {
      onComplete()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div
        className={`flex flex-col items-center gap-8 transition-all duration-500 ${
          show ? "scale-100 opacity-100" : "scale-50 opacity-0"
        }`}
      >
        {/* Hearts Animation */}
        <div className="relative">
          <Heart className="h-32 w-32 text-red-500 fill-red-500 animate-pulse" />
          <Heart className="absolute top-0 left-0 h-32 w-32 text-red-500 fill-red-500 animate-ping" />
        </div>

        {/* Match Text */}
        <div className="text-center space-y-2">
          <h1 className="text-6xl font-bold text-white animate-in zoom-in-50 duration-500">It's a Match!</h1>
          <p className="text-xl text-white/80">You and {userProfile.name} liked each other</p>
        </div>

        {/* User Avatars */}
        <div className="flex items-center gap-8 animate-in slide-in-from-bottom-4 duration-700">
          <Avatar className="h-24 w-24 border-4 border-white shadow-2xl">
            <AvatarImage src="/ai-avatar.png" alt="You" />
            <AvatarFallback>You</AvatarFallback>
          </Avatar>
          <Heart className="h-12 w-12 text-red-500 fill-red-500" />
          <Avatar className="h-24 w-24 border-4 border-white shadow-2xl">
            <AvatarImage src={userProfile.avatar || "/placeholder.svg"} alt={userProfile.name} />
            <AvatarFallback>{userProfile.name[0]}</AvatarFallback>
          </Avatar>
        </div>

        {/* Tap to continue hint */}
        <p className="text-white/60 text-sm animate-pulse">Tap anywhere to continue</p>
      </div>
    </div>
  )
}
