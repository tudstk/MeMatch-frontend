"use client"

import { useState } from "react"
import { SwipeableCard } from "@/components/swipeable-card"
import { CommentDialog } from "@/components/comment-dialog"
import { BottomNav } from "@/components/bottom-nav"
import { mockMemes, type Meme } from "@/lib/mock-data"
import { Flame } from "lucide-react"

export default function FeedPage() {
  const [memes, setMemes] = useState<Meme[]>(mockMemes)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)

  const currentMeme = memes[currentIndex]
  const nextMeme = memes[currentIndex + 1]

  const handleSwipe = (direction: "left" | "right") => {
    console.log("[v0] Swiped:", direction, "on meme:", currentMeme.id)

    if (direction === "right") {
      console.log("[v0] Liked meme:", currentMeme.id)
      setMemes((prevMemes) =>
        prevMemes.map((meme) => (meme.id === currentMeme.id ? { ...meme, likes: meme.likes + 1 } : meme)),
      )
    } else {
      console.log("[v0] Disliked meme:", currentMeme.id)
    }

    // Move to next meme
    if (currentIndex < memes.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Reset to beginning when reaching the end
      setCurrentIndex(0)
    }
  }

  const handleComment = () => {
    setSelectedMeme(currentMeme)
    setCommentDialogOpen(true)
  }

  const handleCommentAdded = (memeId: string, updatedComments: any[]) => {
    setMemes((prevMemes) =>
      prevMemes.map((meme) => (meme.id === memeId ? { ...meme, comments: updatedComments } : meme)),
    )
  }

  if (!currentMeme) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No more memes to show!</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-accent" />
            <h1 className="text-xl font-bold">MemeSwipe</h1>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-8">
        <div className="relative h-[600px]">
          {/* Next card in background */}
          {nextMeme && (
            <div className="absolute inset-0 flex items-center justify-center">
              <SwipeableCard
                key={`next-${nextMeme.id}`}
                meme={nextMeme}
                onSwipe={() => {}}
                onComment={() => {}}
                isInteractive={false}
                className="opacity-50 scale-95"
              />
            </div>
          )}

          {/* Current card on top */}
          <div className="absolute inset-0 flex items-center justify-center">
            <SwipeableCard
              key={currentMeme.id}
              meme={currentMeme}
              onSwipe={handleSwipe}
              onComment={handleComment}
              isInteractive={true}
            />
          </div>
        </div>
      </div>

      <CommentDialog
        meme={selectedMeme}
        open={commentDialogOpen}
        onOpenChange={setCommentDialogOpen}
        onCommentAdded={handleCommentAdded}
      />

      <BottomNav />
    </main>
  )
}
