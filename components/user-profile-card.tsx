"use client"

import { useState, useRef } from "react"
import type { UserProfile, Meme } from "@/lib/mock-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, X, MessageCircle, ChevronLeft, ChevronRight, Maximize } from "lucide-react"
import { CommentDialog } from "@/components/comment-dialog"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface UserProfileCardProps {
  userProfile: UserProfile
  onSwipe: (direction: "left" | "right") => void
  onCommentAdded: (memeId: string, updatedComments: any[]) => void
}

export function UserProfileCard({ userProfile, onSwipe, onCommentAdded }: UserProfileCardProps) {
  const [currentMemeIndex, setCurrentMemeIndex] = useState(0)
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const currentMeme = userProfile.memes[currentMemeIndex]
  const isLastMeme = currentMemeIndex === userProfile.memes.length - 1
  const isFirstMeme = currentMemeIndex === 0

  const handleNextMeme = () => {
    if (!isLastMeme) {
      setCurrentMemeIndex((prev) => prev + 1)
    }
  }

  const handlePrevMeme = () => {
    if (!isFirstMeme) {
      setCurrentMemeIndex((prev) => prev - 1)
    }
  }

  const handleLike = () => {
    onSwipe("right")
  }

  const handleReject = () => {
    onSwipe("left")
  }

  const handleComment = () => {
    setSelectedMeme(currentMeme)
    setCommentDialogOpen(true)
  }

  const handleOpenImageViewer = () => {
    setImageViewerOpen(true)
  }

  return (
    <>
      <div ref={cardRef} className="relative w-full h-full bg-card rounded-3xl overflow-hidden shadow-2xl">
        {/* User Profile Header */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white">
              <AvatarImage src={userProfile.avatar || "/placeholder.svg"} alt={userProfile.name} />
              <AvatarFallback>{userProfile.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-white">
              <h2 className="text-2xl font-bold">{userProfile.name}</h2>
              <p className="text-sm text-white/90">{userProfile.bio}</p>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span>{userProfile.stats?.totalMemes} memes</span>
                <span>{userProfile.stats?.totalLikes.toLocaleString()} likes</span>
                <span>{userProfile.stats?.followers.toLocaleString()} followers</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenImageViewer}
          className="absolute top-6 right-6 z-30 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all"
        >
          <Maximize className="h-5 w-5" />
        </button>

        {/* Meme Progress Indicators */}
        <div className="absolute top-24 left-0 right-0 z-20 px-6">
          <div className="flex gap-1">
            {userProfile.memes.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index === currentMemeIndex ? "bg-white" : index < currentMemeIndex ? "bg-white/70" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Meme Image */}
        <div className="relative w-full h-full">
          <Image
            src={currentMeme.imageUrl || "/placeholder.svg"}
            alt={currentMeme.caption}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>

        {/* Navigation Arrows */}
        {!isFirstMeme && (
          <button
            onClick={handlePrevMeme}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {!isLastMeme && (
          <button
            onClick={handleNextMeme}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Meme Caption */}
        <div className="absolute bottom-32 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent p-6">
          <p className="text-white text-lg font-medium">{currentMeme.caption}</p>
          <p className="text-white/70 text-sm mt-1">
            {currentMemeIndex + 1} of {userProfile.memes.length}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-6 left-0 right-0 z-20 px-6">
          <div className="flex items-center justify-center gap-6">
            <Button
              size="lg"
              onClick={handleReject}
              className="h-16 w-16 rounded-full bg-white hover:bg-gray-100 text-gray-800 shadow-xl"
            >
              <X className="h-8 w-8" />
            </Button>
            <Button
              size="lg"
              onClick={handleLike}
              className="h-20 w-20 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-xl"
            >
              <Heart className="h-10 w-10 fill-current" />
            </Button>
          </div>
        </div>

        {/* Comment Button - Bottom Right */}
        <button
          onClick={handleComment}
          className="absolute bottom-8 right-8 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      </div>

      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-[95vh] flex items-center justify-center">
            <Image
              src={currentMeme.imageUrl || "/placeholder.svg"}
              alt={currentMeme.caption}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </DialogContent>
      </Dialog>

      <CommentDialog
        meme={selectedMeme}
        open={commentDialogOpen}
        onOpenChange={setCommentDialogOpen}
        onCommentAdded={onCommentAdded}
      />
    </>
  )
}
