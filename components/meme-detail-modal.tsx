"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth-context"
import { 
  commentsApi, 
  likesApi, 
  transformCommentToFrontend,
  type FrontendMeme,
  type FrontendComment
} from "@/lib/api"
import { Heart, MessageCircle, Send } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface MemeDetailModalProps {
  meme: FrontendMeme | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMemeUpdate?: (updatedMeme: FrontendMeme) => void
}

export function MemeDetailModal({ meme, open, onOpenChange, onMemeUpdate }: MemeDetailModalProps) {
  const { user } = useAuth()
  const [comment, setComment] = useState("")
  const [localMeme, setLocalMeme] = useState<FrontendMeme | null>(meme)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comments, setComments] = useState<FrontendComment[]>([])
  const [loading, setLoading] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)

  useEffect(() => {
    if (meme && open) {
      setLocalMeme(meme)
      setComments(meme.comments || [])
      setLikeCount(meme.likes || 0)
      loadLikeStatus()
      loadComments()
    }
  }, [meme, open])

  const loadLikeStatus = async () => {
    if (!meme || !user) return
    
    try {
      const status = await likesApi.checkStatus(user.id, parseInt(meme.id))
      setIsLiked(status.hasLiked)
    } catch (err) {
      console.error('Error loading like status:', err)
    }
  }

  const loadComments = async () => {
    if (!meme) return
    
    try {
      const backendComments = await commentsApi.getByMeme(parseInt(meme.id))
      const frontendComments = backendComments.map(transformCommentToFrontend)
      setComments(frontendComments)
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }

  const handleLike = async () => {
    if (!localMeme || !user) return

    setLoading(true)
    try {
      if (isLiked) {
        await likesApi.unlike(user.id, parseInt(localMeme.id))
        setIsLiked(false)
        setLikeCount(prev => prev - 1)
      } else {
        await likesApi.like(user.id, parseInt(localMeme.id))
        setIsLiked(true)
        setLikeCount(prev => prev + 1)
      }

      const updatedMeme = {
        ...localMeme,
        likes: likeCount + (isLiked ? -1 : 1),
      }
      setLocalMeme(updatedMeme)

      if (onMemeUpdate) {
        onMemeUpdate(updatedMeme)
      }
    } catch (err: any) {
      console.error('Error toggling like:', err)
      alert(err.message || 'Failed to update like')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !localMeme || !user) return

    setCommentLoading(true)
    try {
      const newComment = await commentsApi.create(
        user.id,
        parseInt(localMeme.id),
        comment.trim()
      )
      
      const frontendComment = transformCommentToFrontend(newComment)
      const updatedComments = [...comments, frontendComment]
      setComments(updatedComments)
      setComment("")

      const updatedMeme = {
        ...localMeme,
        comments: updatedComments,
      }
      setLocalMeme(updatedMeme)

      if (onMemeUpdate) {
        onMemeUpdate(updatedMeme)
      }
    } catch (err: any) {
      console.error('Error adding comment:', err)
      alert(err.message || 'Failed to add comment')
    } finally {
      setCommentLoading(false)
    }
  }

  if (!localMeme) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0">
        <div className="grid md:grid-cols-[2fr,1fr] h-full">
          {/* Left side - Meme image */}
          <div className="relative bg-black flex items-center justify-center">
            <Image
              src={localMeme.imageUrl || "/placeholder.svg"}
              alt={localMeme.caption}
              fill
              className="object-contain"
            />
          </div>

          {/* Right side - Details, comments, and interactions */}
          <div className="flex flex-col h-full bg-card">
            {/* Header with author info */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarImage src={localMeme.author.avatar || "/placeholder.svg"} alt={localMeme.author.name} />
                  <AvatarFallback>{localMeme.author.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{localMeme.author.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(localMeme.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Caption */}
            <div className="p-4 border-b border-border">
              <p className="text-sm leading-relaxed">{localMeme.caption}</p>
            </div>

            {/* Comments section */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={c.userAvatar || "/placeholder.svg"} alt={c.userName} />
                        <AvatarFallback>{c.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{c.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed break-words">{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Actions and comment input */}
            <div className="border-t border-border">
              {/* Like and comment count */}
              <div className="flex items-center gap-6 px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("gap-2 hover:text-red-500", isLiked && "text-red-500")}
                  onClick={handleLike}
                >
                  <Heart className={cn("h-5 w-5", isLiked && "fill-red-500")} />
                  <span className="font-medium">{likeCount.toLocaleString()}</span>
                </Button>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">{comments.length}</span>
                </div>
              </div>

              {/* Comment input */}
              <form onSubmit={handleSubmitComment} className="flex gap-2 p-4 border-t border-border">
                <Input
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
