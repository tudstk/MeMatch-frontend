"use client"

import { useState } from "react"
import { UserProfileCard } from "@/components/user-profile-card"
import { BottomNav } from "@/components/bottom-nav"
import { MatchAnimation } from "@/components/match-animation"
import { mockUserProfiles, type UserProfile } from "@/lib/mock-data"
import { Flame, Heart, X } from "lucide-react"

export default function FeedPage() {
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>(mockUserProfiles)
  const [currentUserIndex, setCurrentUserIndex] = useState(0)
  const [likeCount, setLikeCount] = useState(0)
  const [rejectCount, setRejectCount] = useState(0)
  const [showAnimation, setShowAnimation] = useState<"like" | "reject" | null>(null)
  const [showMatchAnimation, setShowMatchAnimation] = useState(false)
  const [matchedUser, setMatchedUser] = useState<UserProfile | null>(null)
  const [matchedUsers, setMatchedUsers] = useState<UserProfile[]>([])

  const currentUserProfile = userProfiles[currentUserIndex]
  const nextUserProfile = userProfiles[currentUserIndex + 1]

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "right") {
      setLikeCount((prev) => prev + 1)
      setShowAnimation("like")

      if (currentUserProfile.hasLikedYou) {
        setTimeout(() => {
          setMatchedUser(currentUserProfile)
          setShowMatchAnimation(true)
          setMatchedUsers((prev) => [...prev, currentUserProfile])
        }, 800)
      }
    } else {
      setRejectCount((prev) => prev + 1)
      setShowAnimation("reject")
    }

    // Clear animation after delay
    setTimeout(() => setShowAnimation(null), 800)

    // Move to next user profile
    if (currentUserIndex < userProfiles.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1)
    } else {
      setCurrentUserIndex(0)
    }
  }

  const handleCommentAdded = (memeId: string, updatedComments: any[]) => {
    setUserProfiles((prevProfiles) =>
      prevProfiles.map((profile) => ({
        ...profile,
        memes: profile.memes.map((meme) => (meme.id === memeId ? { ...meme, comments: updatedComments } : meme)),
      })),
    )
  }

  const handleMatchAnimationComplete = () => {
    setShowMatchAnimation(false)
    setMatchedUser(null)
  }

  if (!currentUserProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No more profiles to show!</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-accent" />
            <h1 className="text-xl font-bold">MemeSwipe</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 bg-red-500/10 px-3 py-1.5 rounded-full">
              <Heart className="h-4 w-4 text-red-500 fill-red-500" />
              <span className="font-semibold text-red-500">{likeCount}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-500/10 px-3 py-1.5 rounded-full">
              <X className="h-4 w-4 text-gray-500" />
              <span className="font-semibold text-gray-500">{rejectCount}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-8">
        <div className="relative h-[600px]">
          {/* Next user profile in background */}
          {nextUserProfile && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full opacity-50 scale-95 transition-all">
                <UserProfileCard userProfile={nextUserProfile} onSwipe={() => {}} onCommentAdded={() => {}} />
              </div>
            </div>
          )}

          {/* Current user profile */}
          <div className="absolute inset-0 flex items-center justify-center">
            <UserProfileCard
              userProfile={currentUserProfile}
              onSwipe={handleSwipe}
              onCommentAdded={handleCommentAdded}
            />
          </div>

          {/* Like Animation */}
          {showAnimation === "like" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 animate-in zoom-in-50 fade-in duration-300">
              <div className="bg-red-500 text-white rounded-full p-12 shadow-2xl animate-pulse">
                <Heart className="h-24 w-24 fill-current" />
              </div>
            </div>
          )}

          {/* Reject Animation */}
          {showAnimation === "reject" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 animate-in zoom-in-50 fade-in duration-300">
              <div className="bg-gray-500 text-white rounded-full p-12 shadow-2xl animate-pulse">
                <X className="h-24 w-24 stroke-[3]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {showMatchAnimation && matchedUser && (
        <div onClick={handleMatchAnimationComplete}>
          <MatchAnimation userProfile={matchedUser} onComplete={handleMatchAnimationComplete} />
        </div>
      )}

      <BottomNav />
    </main>
  )
}
