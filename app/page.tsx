"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserProfileCard } from "@/components/user-profile-card"
import { BottomNav } from "@/components/bottom-nav"
import { MatchAnimation } from "@/components/match-animation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
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
  const [currentUserHumourTags, setCurrentUserHumourTags] = useState<string[]>([])

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
      
      // Get users for feed (excludes current user and matched users)
      const currentUserId = user?.id
      if (!currentUserId) {
        setError('User not authenticated')
        return
      }
      
      const otherUsers = await usersApi.getForFeed(currentUserId)
      
      // Get current user's data to calculate matching tags
      const currentUserData = await usersApi.getById(currentUserId)
      // Store current user's profile humour tags for comparison
      setCurrentUserHumourTags(currentUserData.humourTags || [])
      
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
          
          const profile = transformUserToFrontendProfile(user, transformedMemes)
          
          // Calculate matching tags count
          const currentUserPreferences = currentUserData.humourTagsPreference || []
          const otherUserTags = user.humourTags || []
          const matchingTags = currentUserPreferences.filter(tag => otherUserTags.includes(tag))
          profile.matchingTagsCount = matchingTags.length
          profile.humourTags = otherUserTags
          
          return profile
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

    const currentProfileId = currentUserProfile.id
    let isMatch = false

    if (direction === "right") {
      setLikeCount((prev) => prev + 1)
      setShowAnimation("like")

      // Like the user (not their memes)
      try {
        const currentUserId = parseInt(currentProfileId)
        
        // Like the user - this will create a match if mutual
        const result = await matchesApi.likeUser(user.id, currentUserId)
        
        // If it's a match, show the match animation
        if (result.isMatch) {
          isMatch = true
          // Set matched user immediately so animation can show
          setMatchedUser(currentUserProfile)
          setMatchedUsers((prev) => [...prev, currentUserProfile])
          // Show match animation after like animation completes
          setTimeout(() => {
            setShowMatchAnimation(true)
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

    // Remove user from feed and handle navigation
    setUserProfiles((prev) => {
      const filtered = prev.filter(p => p.id !== currentProfileId)
      
      // If it's a match, don't navigate yet - wait for animation
      if (isMatch) {
        // Keep index at 0 (next user will be at index 0 after removal)
        return filtered
      }
      
      // For non-matches, handle navigation after state update
      if (filtered.length === 0) {
        // No more users, reload feed
        setTimeout(() => {
          loadUserProfiles()
          setCurrentUserIndex(0)
        }, 100)
      } else {
        // There are more users, stay at index 0 (which now points to the next user)
        // Set index after state update completes
        setTimeout(() => {
          setCurrentUserIndex(0)
        }, 0)
      }
      
      return filtered
    })
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
    // After match animation, reload feed to get updated list (without matched user)
    loadUserProfiles()
    setCurrentUserIndex(0)
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

  if (!currentUserProfile && !showMatchAnimation && !matchedUser) {
    return (
      <main className="min-h-screen bg-background pb-20">
        <Navbar />
        <header className="sticky top-16 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-center">
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
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No more profiles to show!</p>
            <Button onClick={loadUserProfiles} variant="outline">
              Reload Profiles
            </Button>
          </div>
        </div>
        <BottomNav />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <Navbar />
      <header className="sticky top-16 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-center">
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
                <UserProfileCard userProfile={nextUserProfile} onSwipe={() => {}} />
              </div>
            </div>
          )}

          {/* Current user profile */}
          {currentUserProfile && (
            <div className="absolute inset-0 flex items-center justify-center">
              <UserProfileCard
                userProfile={currentUserProfile}
                onSwipe={handleSwipe}
              />
            </div>
          )}

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

        {/* Profile Information - Below Card */}
        {currentUserProfile && (
          <div className="mt-4 space-y-3">
            {/* Profile Details */}
            <div className="flex items-center gap-3 flex-wrap">
              {currentUserProfile.age && (
                <span className="px-3 py-1.5 bg-card border border-border rounded-full text-sm">
                  {currentUserProfile.age} years old
                </span>
              )}
              {currentUserProfile.gender && (
                <span className="px-3 py-1.5 bg-card border border-border rounded-full text-sm">
                  {currentUserProfile.gender}
                </span>
              )}
              {(currentUserProfile.city || currentUserProfile.country) && (
                <span className="px-3 py-1.5 bg-card border border-border rounded-full text-sm">
                  {[currentUserProfile.city, currentUserProfile.country].filter(Boolean).join(', ')}
                </span>
              )}
            </div>

            {/* Humour Tags */}
            {currentUserProfile.humourTags && currentUserProfile.humourTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentUserProfile.humourTags.map((tag, index) => {
                  const isMatching = currentUserHumourTags.includes(tag)
                  return (
                    <span
                      key={index}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        isMatching
                          ? 'bg-purple-500/20 text-purple-600 border border-purple-500/40'
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                      }`}
                    >
                      {tag.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        )}
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
