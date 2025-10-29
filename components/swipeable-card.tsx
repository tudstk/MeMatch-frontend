"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Heart, MessageCircle, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Meme } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface SwipeableCardProps {
  meme: Meme
  onSwipe: (direction: "left" | "right") => void
  onComment: () => void
  isInteractive?: boolean
  className?: string
}

export function SwipeableCard({ meme, onSwipe, onComment, isInteractive = true, className }: SwipeableCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const SWIPE_THRESHOLD = 100 // pixels to trigger swipe
  const ROTATION_FACTOR = 0.1 // rotation intensity

  useEffect(() => {
    if (!isInteractive) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const deltaX = e.clientX - startPos.x
      const deltaY = e.clientY - startPos.y

      setDragOffset({ x: deltaX, y: deltaY })

      // Determine swipe direction
      if (Math.abs(deltaX) > 20) {
        setSwipeDirection(deltaX > 0 ? "right" : "left")
      }
    }

    const handleMouseUp = () => {
      if (!isDragging) return

      setIsDragging(false)

      // Check if swipe threshold was met
      if (Math.abs(dragOffset.x) > SWIPE_THRESHOLD) {
        const direction = dragOffset.x > 0 ? "right" : "left"

        // Animate card off screen
        setDragOffset({
          x: direction === "right" ? 1000 : -1000,
          y: dragOffset.y,
        })

        // Trigger swipe callback after animation
        setTimeout(() => {
          onSwipe(direction)
          setDragOffset({ x: 0, y: 0 })
          setSwipeDirection(null)
        }, 300)
      } else {
        // Reset position
        setDragOffset({ x: 0, y: 0 })
        setSwipeDirection(null)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - startPos.x
      const deltaY = touch.clientY - startPos.y

      setDragOffset({ x: deltaX, y: deltaY })

      if (Math.abs(deltaX) > 20) {
        setSwipeDirection(deltaX > 0 ? "right" : "left")
      }
    }

    const handleTouchEnd = () => {
      if (!isDragging) return

      setIsDragging(false)

      if (Math.abs(dragOffset.x) > SWIPE_THRESHOLD) {
        const direction = dragOffset.x > 0 ? "right" : "left"

        setDragOffset({
          x: direction === "right" ? 1000 : -1000,
          y: dragOffset.y,
        })

        setTimeout(() => {
          onSwipe(direction)
          setDragOffset({ x: 0, y: 0 })
          setSwipeDirection(null)
        }, 300)
      } else {
        setDragOffset({ x: 0, y: 0 })
        setSwipeDirection(null)
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("touchmove", handleTouchMove)
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDragging, startPos, dragOffset, onSwipe, isInteractive])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isInteractive) return
    setIsDragging(true)
    setStartPos({ x: e.clientX, y: e.clientY })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isInteractive) return
    const touch = e.touches[0]
    setIsDragging(true)
    setStartPos({ x: touch.clientX, y: touch.clientY })
  }

  const handleLike = () => {
    if (!isInteractive) return
    onSwipe("right")
  }

  const handleDislike = () => {
    if (!isInteractive) return
    onSwipe("left")
  }

  const rotation = dragOffset.x * ROTATION_FACTOR
  const opacity = 1 - Math.abs(dragOffset.x) / 500

  return (
    <Card
      ref={cardRef}
      className={cn(
        "w-full max-w-sm overflow-hidden shadow-2xl select-none",
        isInteractive && "cursor-grab active:cursor-grabbing",
        className,
      )}
      style={{
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
        transition: isDragging ? "none" : "transform 0.3s ease-out",
        opacity: isInteractive ? opacity : undefined,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="relative aspect-[3/4] bg-muted">
        <Image
          src={meme.imageUrl || "/placeholder.svg"}
          alt={meme.caption}
          fill
          className="object-cover pointer-events-none"
          draggable={false}
        />

        {/* Swipe indicators */}
        {isInteractive && swipeDirection === "right" && Math.abs(dragOffset.x) > 30 && (
          <div className="absolute inset-0 flex items-center justify-center bg-accent/20 animate-in fade-in">
            <div className="bg-accent text-accent-foreground px-8 py-4 rounded-full font-bold text-2xl rotate-12 border-4 border-accent">
              LIKE
            </div>
          </div>
        )}

        {isInteractive && swipeDirection === "left" && Math.abs(dragOffset.x) > 30 && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/20 animate-in fade-in">
            <div className="bg-destructive text-destructive-foreground px-8 py-4 rounded-full font-bold text-2xl -rotate-12 border-4 border-destructive">
              NOPE
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary">
            <AvatarImage src={meme.author.avatar || "/placeholder.svg"} alt={meme.author.name} />
            <AvatarFallback>{meme.author.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{meme.author.name}</p>
            <p className="text-xs text-muted-foreground">{new Date(meme.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed">{meme.caption}</p>
        <div className="flex items-center gap-4 text-muted-foreground text-sm">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span>{meme.likes.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            <span>{meme.comments.length}</span>
          </div>
        </div>
      </div>

      {isInteractive && (
        <div className="absolute bottom-40 left-0 right-0 flex items-center justify-center gap-6 p-4 pointer-events-none">
          <Button
            size="lg"
            variant="destructive"
            className="h-16 w-16 rounded-full shadow-lg pointer-events-auto"
            onClick={handleDislike}
          >
            <X className="h-8 w-8" />
          </Button>
          <Button
            size="lg"
            variant="default"
            className="h-16 w-16 rounded-full shadow-lg bg-accent hover:bg-accent/90 pointer-events-auto"
            onClick={handleLike}
          >
            <Heart className="h-8 w-8" />
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="h-14 w-14 rounded-full shadow-lg pointer-events-auto"
            onClick={onComment}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      )}
    </Card>
  )
}
