"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type FrontendMeme, type FrontendComment } from "@/lib/api"
import { commentsApi, transformCommentToFrontend } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Send } from "lucide-react"

interface CommentDialogProps {
  meme: FrontendMeme | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCommentAdded?: (memeId: string, updatedComments: FrontendComment[]) => void
}

export function CommentDialog({ meme, open, onOpenChange, onCommentAdded }: CommentDialogProps) {
  const { user } = useAuth()
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState<FrontendComment[]>(meme?.comments || [])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (meme) {
      loadComments()
    }
  }, [meme, open])

  const loadComments = async () => {
    if (!meme) return
    
    try {
      const backendComments = await commentsApi.getByMeme(parseInt(meme.id))
      const frontendComments = backendComments.map(transformCommentToFrontend)
      setComments(frontendComments)
    } catch (err) {
      console.error('Error loading comments:', err)
      setComments(meme.comments || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !meme || !user) return

    setLoading(true)
    try {
      const newComment = await commentsApi.create(
        user.id,
        parseInt(meme.id),
        comment.trim()
      )
      
      const frontendComment = transformCommentToFrontend(newComment)
      const updatedComments = [...comments, frontendComment]
      setComments(updatedComments)
      setComment("")

      if (onCommentAdded) {
        onCommentAdded(meme.id, updatedComments)
      }
    } catch (err: any) {
      console.error('Error adding comment:', err)
      alert(err.message || 'Failed to add comment')
    } finally {
      setLoading(false)
    }
  }

  if (!meme) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={c.userAvatar || "/placeholder.svg"} alt={c.userName} />
                    <AvatarFallback>{c.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{c.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t">
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
      </DialogContent>
    </Dialog>
  )
}
