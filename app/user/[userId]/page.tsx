"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { BottomNav } from "@/components/bottom-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { 
  usersApi, 
  memesApi, 
  likesApi, 
  commentsApi,
  transformMemeToFrontend,
  transformCommentToFrontend,
  transformUserToFrontendProfile,
  type FrontendUserProfile,
  type FrontendMeme,
  type HumourTag
} from "@/lib/api"
import { Heart, MessageCircle } from "lucide-react"
import Image from "next/image"
import { CommentDialog } from "@/components/comment-dialog"
import { MemeDetailModal } from "@/components/meme-detail-modal"
import { cn } from "@/lib/utils"

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth()
  const userId = params?.userId ? parseInt(params.userId as string) : null

  const [userProfile, setUserProfile] = useState<FrontendUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMeme, setSelectedMeme] = useState<FrontendMeme | null>(null)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [memeDetailOpen, setMemeDetailOpen] = useState(false)
  const [likedMemes, setLikedMemes] = useState<Set<string>>(new Set())
  const [likingMemeId, setLikingMemeId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (userId) {
        loadUserProfile()
      }
    }
  }, [isAuthenticated, authLoading, userId, router])

  const loadUserProfile = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const userData = await usersApi.getById(userId)
      const memes = await memesApi.getByUser(userId)

      // Transform memes to frontend format
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

      const profile = transformUserToFrontendProfile(userData, transformedMemes)
      setUserProfile(profile)

      // Check which memes the current user has liked
      if (currentUser) {
        const likedStatuses = await Promise.all(
          transformedMemes.map(async (meme) => {
            try {
              const status = await likesApi.checkStatus(currentUser.id, parseInt(meme.id))
              return { memeId: meme.id, isLiked: status.hasLiked }
            } catch (err) {
              console.error(`Error checking like status for meme ${meme.id}:`, err)
              return { memeId: meme.id, isLiked: false }
            }
          })
        )
        
        const likedSet = new Set(
          likedStatuses.filter(s => s.isLiked).map(s => s.memeId)
        )
        setLikedMemes(likedSet)
      }
    } catch (err: any) {
      console.error('Error loading user profile:', err)
      setError(err.message || 'Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  const handleMemeClick = (meme: FrontendMeme) => {
    setSelectedMeme(meme)
    setMemeDetailOpen(true)
  }

  const handleComment = (meme: FrontendMeme, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setSelectedMeme(meme)
    setCommentDialogOpen(true)
  }

  const handleMemeUpdate = async (updatedMeme: FrontendMeme) => {
    if (userProfile && currentUser) {
      // Update the meme in the profile
      setUserProfile({
        ...userProfile,
        memes: userProfile.memes.map((m) =>
          m.id === updatedMeme.id ? updatedMeme : m
        ),
      })
      setSelectedMeme(updatedMeme)
      
      // Check if the like status changed by checking the API
      try {
        const status = await likesApi.checkStatus(currentUser.id, parseInt(updatedMeme.id))
        setLikedMemes(prev => {
          const newSet = new Set(prev)
          if (status.hasLiked) {
            newSet.add(updatedMeme.id)
          } else {
            newSet.delete(updatedMeme.id)
          }
          return newSet
        })
      } catch (err) {
        console.error('Error checking like status after update:', err)
      }
    }
  }

  const handleCommentAdded = async (memeId: string, updatedComments: any[]) => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        memes: userProfile.memes.map((meme) =>
          meme.id === memeId ? { ...meme, comments: updatedComments } : meme
        ),
      })
    }
  }

  const handleLike = async (meme: FrontendMeme, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    if (!currentUser || likingMemeId === meme.id) return

    const isLiked = likedMemes.has(meme.id)
    setLikingMemeId(meme.id)

    try {
      if (isLiked) {
        await likesApi.unlike(currentUser.id, parseInt(meme.id))
        setLikedMemes(prev => {
          const newSet = new Set(prev)
          newSet.delete(meme.id)
          return newSet
        })
        // Update like count
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            memes: userProfile.memes.map((m) =>
              m.id === meme.id ? { ...m, likes: Math.max(0, m.likes - 1) } : m
            ),
          })
        }
      } else {
        await likesApi.like(currentUser.id, parseInt(meme.id))
        setLikedMemes(prev => new Set(prev).add(meme.id))
        // Update like count
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            memes: userProfile.memes.map((m) =>
              m.id === meme.id ? { ...m, likes: m.likes + 1 } : m
            ),
          })
        }
      }
    } catch (err: any) {
      console.error('Error toggling like:', err)
      alert(err.message || 'Failed to update like')
    } finally {
      setLikingMemeId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'User not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* User Profile Header */}
        <div className="bg-card rounded-lg p-6 mb-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarImage src={userProfile.avatar || "/placeholder.svg"} alt={userProfile.name} />
              <AvatarFallback>{userProfile.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{userProfile.name}</h1>
              <p className="text-muted-foreground mb-4">{userProfile.bio}</p>
              
              {/* Profile Details */}
              <div className="flex items-center gap-3 flex-wrap mb-3">
                {userProfile.age && (
                  <span className="px-3 py-1.5 bg-muted rounded-full text-sm">
                    {userProfile.age} years old
                  </span>
                )}
                {userProfile.gender && (
                  <span className="px-3 py-1.5 bg-muted rounded-full text-sm">
                    {userProfile.gender}
                  </span>
                )}
                {(userProfile.city || userProfile.country) && (
                  <span className="px-3 py-1.5 bg-muted rounded-full text-sm">
                    {[userProfile.city, userProfile.country].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>

              {/* Humour Tags */}
              {userProfile.humourTags && userProfile.humourTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {userProfile.humourTags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium"
                    >
                      {tag.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span>{userProfile.stats?.totalMemes || 0} memes</span>
                <span>{userProfile.stats?.totalLikes.toLocaleString() || 0} likes</span>
                <span>{userProfile.stats?.followers.toLocaleString() || 0} followers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Memes Grid */}
        {userProfile.memes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userProfile.memes.map((meme) => (
              <div 
                key={meme.id} 
                className="bg-card rounded-lg overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleMemeClick(meme)}
              >
                <div className="relative aspect-square">
                  <Image
                    src={meme.imageUrl || "/placeholder.svg"}
                    alt={meme.caption}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm mb-3 line-clamp-2">{meme.caption}</p>
                  <div className="flex items-center gap-6">
                    <button
                      onClick={(e) => handleLike(meme, e)}
                      disabled={likingMemeId === meme.id || !currentUser}
                      className={cn(
                        "flex items-center gap-1.5 text-sm transition-colors",
                        likedMemes.has(meme.id) 
                          ? "text-red-500 hover:text-red-600" 
                          : "text-muted-foreground hover:text-foreground",
                        (likingMemeId === meme.id || !currentUser) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Heart 
                        className={cn(
                          "h-5 w-5 transition-all",
                          likedMemes.has(meme.id) && "fill-red-500"
                        )} 
                      />
                      <span className="font-medium">{meme.likes}</span>
                    </button>
                    <button
                      onClick={(e) => handleComment(meme, e)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span className="font-medium">{meme.comments.length}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No memes yet</p>
          </div>
        )}
      </div>

      <CommentDialog
        meme={selectedMeme}
        open={commentDialogOpen}
        onOpenChange={setCommentDialogOpen}
        onCommentAdded={handleCommentAdded}
      />

      <MemeDetailModal
        meme={selectedMeme}
        open={memeDetailOpen}
        onOpenChange={setMemeDetailOpen}
        onMemeUpdate={handleMemeUpdate}
      />

      <BottomNav />
    </main>
  )
}
