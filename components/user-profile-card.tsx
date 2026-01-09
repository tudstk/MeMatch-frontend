"use client"

import type React from "react"

import { useState, useRef } from "react"
import type { FrontendUserProfile, FrontendMeme } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, X, ChevronLeft, ChevronRight, Maximize } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface UserProfileCardProps {
  userProfile: FrontendUserProfile
  onSwipe: (direction: "left" | "right") => void
}

export function UserProfileCard({ userProfile, onSwipe }: UserProfileCardProps) {
  const router = useRouter()
  const [currentMemeIndex, setCurrentMemeIndex] = useState(0)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleUsernameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/user/${userProfile.id}`)
  }

  const currentMeme = userProfile.memes[currentMemeIndex]
  const isLastMeme = currentMemeIndex === userProfile.memes.length - 1
  const isFirstMeme = currentMemeIndex === 0

  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true)
    setStartPos({ x: clientX, y: clientY })
  }

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return
    const deltaX = clientX - startPos.x
    const deltaY = clientY - startPos.y
    setDragOffset({ x: deltaX, y: deltaY })
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    const threshold = 100
    if (Math.abs(dragOffset.x) > threshold) {
      if (dragOffset.x > 0) {
        handleLike()
      } else {
        handleReject()
      }
    }
    setDragOffset({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    handleDragEnd()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleDragStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleDragMove(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = () => {
    handleDragEnd()
  }

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


  const handleOpenImageViewer = () => {
    setImageViewerOpen(true)
  }

  const rotation = dragOffset.x / 20
  const opacity = Math.min(Math.abs(dragOffset.x) / 100, 1)

  if (!currentMeme) return null

  return (
    <>
      <div
        ref={cardRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        className="relative w-full h-full bg-card rounded-3xl overflow-hidden shadow-2xl"
      >
        {dragOffset.x > 50 && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
            style={{ opacity }}
          >
            <div className="text-8xl font-bold text-red-500 border-8 border-red-500 px-8 py-4 rotate-[-20deg]">
              LIKE
            </div>
          </div>
        )}

        {dragOffset.x < -50 && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
            style={{ opacity }}
          >
            <div className="text-8xl font-bold text-white border-8 border-white px-8 py-4 rotate-[20deg]">NOPE</div>
          </div>
        )}

        {/* User Profile Header */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white">
              <AvatarImage src={userProfile?.avatar || "/placeholder.svg"} alt={userProfile.name} />
              <AvatarFallback>{userProfile.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-white">
              <h2 
                className="text-2xl font-bold cursor-pointer hover:underline"
                onClick={handleUsernameClick}
              >
                {userProfile.name}
              </h2>
              <p className="text-sm text-white/90">{userProfile.bio}</p>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span>{userProfile.stats?.totalMemes} memes</span>
                <span>{userProfile.stats?.totalLikes.toLocaleString()} likes</span>
                <span>{userProfile.stats?.followers.toLocaleString()} followers</span>
              </div>
              {userProfile.matchingTagsCount !== undefined && userProfile.matchingTagsCount > 0 && (
                <div className="mt-2 px-3 py-1 bg-green-500/80 rounded-full text-xs font-semibold inline-block">
                  Matches {userProfile.matchingTagsCount} tag{userProfile.matchingTagsCount !== 1 ? 's' : ''}
                </div>
              )}
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
            src={currentMeme?.imageUrl || "/placeholder.svg"}
            alt={currentMeme?.caption}
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
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent p-6">
          <p className="text-white text-lg mb-0 font-medium">{currentMeme?.caption}</p>
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
      </div>

      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-[95vh] flex items-center justify-center">
            <Image
              src={currentMeme?.imageUrl || "/placeholder.svg"}
              alt={currentMeme?.caption}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
