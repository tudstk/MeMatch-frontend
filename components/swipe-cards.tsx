"use client"

import { useState } from "react"
import { mockMemes } from "@/lib/mock-data"
import { MemeCard } from "./meme-card"
import { Button } from "./ui/button"
import { Heart, X, MessageCircle } from "lucide-react"

export function SwipeCards() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showComments, setShowComments] = useState(false)

  const currentMeme = mockMemes[currentIndex]

  const handleLike = () => {
    if (currentIndex < mockMemes.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setCurrentIndex(0)
    }
  }

  const handlePass = () => {
    if (currentIndex < mockMemes.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setCurrentIndex(0)
    }
  }

  const handleComment = () => {
    setShowComments(!showComments)
  }

  if (!currentMeme) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] px-4">
        <p className="text-muted-foreground">No more memes!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-6">
      <MemeCard meme={currentMeme} onLike={handleLike} onDislike={handlePass} onComment={handleComment} />

      <div className="flex items-center justify-center gap-6 mt-8">
        <Button
          size="lg"
          variant="outline"
          className="h-16 w-16 rounded-full border-2 hover:border-destructive hover:bg-destructive/10 transition-all bg-transparent"
          onClick={handlePass}
        >
          <X className="h-8 w-8 text-destructive" />
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 rounded-full border-2 hover:border-primary hover:bg-primary/10 transition-all bg-transparent"
          onClick={handleComment}
        >
          <MessageCircle className="h-6 w-6 text-primary" />
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="h-16 w-16 rounded-full border-2 hover:border-accent hover:bg-accent/10 transition-all bg-transparent"
          onClick={handleLike}
        >
          <Heart className="h-8 w-8 text-accent" />
        </Button>
      </div>
    </div>
  )
}
