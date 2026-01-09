"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserProfileCard } from "@/components/user-profile-card"
import { BottomNav } from "@/components/bottom-nav"
import { MatchAnimation } from "@/components/match-animation"
import { useAuth } from "@/lib/auth-context"
import { 
  usersApi, 
  memesApi, 
  likesApi, 
  commentsApi, 
  matchesApi,
  transformMemeToFrontend,
  transformCommentToFrontend,
  transformUserToFrontendProfile,
  type FrontendUserProfile,
  type FrontendMeme
} from "@/lib/api"
import { Flame, Heart, X } from "lucide-react"

export default function FeedPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth()
  const router = useRouter()
  const [userProfiles, setUserProfiles] = useState<FrontendUserProfile[]>([])
  const [currentUserIndex, setCurrentUserIndex] = useState(0)
  const [likeCount, setLikeCount] = useState(0)
  const [rejectCount, setRejectCount] = useState(0)
  const [showAnimation, setShowAnimation] = useState<"like" | "reject" | null>(null)
  const [showMatchAnimation, setShowMatchAnimation] = useState(false)
  const [matchedUser, setMatchedUser] = useState<FrontendUserProfile | null>(null)
  const [matchedUsers, setMatchedUsers] = useState<FrontendUserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else {
        loadUserProfiles()
      }
    }
  }, [isAuthenticated, authLoading, router])

  const loadUserProfiles = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get all users
      const users = await usersApi.getAll()
      
      // Filter out current user
      const currentUserId = user?.id
      const otherUsers = users.filter(u => u.id !== currentUserId)
      
      // Load profiles with memes for each user
      const profilesPromises = otherUsers.map(async (user) => {
        try {
          const memes = await memesApi.getByUser(user.id)
          
          // Transform memes to frontend format with likes and comments
          const transformedMemes = await Promise.all(
            memes.map(async (meme) => {
              try {
                const [likeCountRes, comments] = await Promise.all([
                  likesApi.getCount(meme.id),
                  commentsApi.getByMeme(meme.id)
                ])
                
                const frontendComments = comments.map(transformCommentToFrontend)
                
                return transformMemeToFrontend(meme, likeCountRes.count, frontendComments)
              } catch (err) {
                console.error(`Error loading meme ${meme.id}:`, err)
                return transformMemeToFrontend(meme, 0, [])
              }
            })
          )
          
          return transformUserToFrontendProfile(user, transformedMemes)
        } catch (err) {
          console.error(`Error loading profile for user ${user.id}:`, err)
          return null
        }
      })
      
      const profiles = (await Promise.all(profilesPromises)).filter((p): p is FrontendUserProfile => p !== null)
      
      // Check which users have liked the current user (for potential matches)
      if (currentUserId) {
        // Check for each profile if they have liked the current user
        const hasLikedChecks = await Promise.all(
          profiles.map(async (profile) => {
            try {
              const profileUserId = parseInt(profile.id)
              const hasLiked = await matchesApi.hasUserLikedUser(profileUserId, currentUserId)
              return { profileId: profile.id, hasLiked: hasLiked.hasLiked }
            } catch (err) {
              console.error(`Error checking if user ${profile.id} has liked current user:`, err)
              return { profileId: profile.id, hasLiked: false }
            }
          })
        )
        
        // Update profiles with hasLikedYou status
        profiles.forEach(profile => {
          const check = hasLikedChecks.find(c => c.profileId === profile.id)
          profile.hasLikedYou = check?.hasLiked || false
        })
      }
      
      setUserProfiles(profiles)
    } catch (err: any) {
      console.error('Error loading user profiles:', err)
      setError(err.message || 'Failed to load profiles')
    } finally {
      setLoading(false)
    }
  }

  const handleSwipe = async (direction: "left" | "right") => {
    if (!user || !currentUserProfile) return

    if (direction === "right") {
      setLikeCount((prev) => prev + 1)
      setShowAnimation("like")

      // Like the user (not their memes)
      try {
        const currentUserId = parseInt(currentUserProfile.id)
        
        // Like the user - this will create a match if mutual
        const result = await matchesApi.likeUser(user.id, currentUserId)
        
        // If it's a match, show the match animation
        if (result.isMatch) {
          setTimeout(() => {
            setMatchedUser(currentUserProfile)
            setShowMatchAnimation(true)
            setMatchedUsers((prev) => [...prev, currentUserProfile])
          }, 800)
        }
      } catch (err) {
        console.error('Error liking user:', err)
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
      // Reload profiles when we run out
      loadUserProfiles()
      setCurrentUserIndex(0)
    }
  }

  const handleCommentAdded = async (memeId: string, updatedComments: any[]) => {
    setUserProfiles((prevProfiles) =>
      prevProfiles.map((profile) => ({
        ...profile,
        memes: profile.memes.map((meme) => 
          meme.id === memeId ? { ...meme, comments: updatedComments } : meme
        ),
      }))
    )
  }

  const handleMatchAnimationComplete = () => {
    setShowMatchAnimation(false)
    setMatchedUser(null)
  }

  const currentUserProfile = userProfiles[currentUserIndex]
  const nextUserProfile = userProfiles[currentUserIndex + 1]

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={loadUserProfiles}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
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
