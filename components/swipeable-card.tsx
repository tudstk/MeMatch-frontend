"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, X, MessageCircle } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Meme } from "@/lib/mock-data"

interface SwipeableCardProps {
  meme: Meme
  onSwipe: (direction: "left" | "right") => void
  onComment: () => void
  isInteractive?: boolean
  className?: string
}

export function SwipeableCard({
  meme,
  onSwipe,
  onComment,
  isInteractive = true,
  className,
}: SwipeableCardProps) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [swipeDirection, setSwipeDirection] =
    useState<"left" | "right" | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)

  const SWIPE_THRESHOLD = 100
  const ROTATION_FACTOR = 0.1

  useEffect(() => {
    if (!isInteractive || !isDragging) return

    const handleMove = (clientX: number, clientY: number) => {
      const deltaX = clientX - startPos.x
      const deltaY = clientY - startPos.y
      setDragOffset({ x: deltaX, y: deltaY })

      if (Math.abs(deltaX) > 20) {
        setSwipeDirection(deltaX > 0 ? "right" : "left")
      } else {
        setSwipeDirection(null)
      }
    }

    const handleMouseMove = (e: MouseEvent) =>
      handleMove(e.clientX, e.clientY)

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      handleMove(touch.clientX, touch.clientY)
    }

    const handleEnd = () => {
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
    document.addEventListener("mouseup", handleEnd)
    document.addEventListener("touchmove", handleTouchMove)
    document.addEventListener("touchend", handleEnd)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleEnd)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleEnd)
    }
  }, [isDragging, dragOffset, startPos, isInteractive, onSwipe])

  const handleStart = (clientX: number, clientY: number) => {
    if (!isInteractive) return
    setIsDragging(true)
    setStartPos({ x: clientX, y: clientY })
  }

  const rotation = dragOffset.x * ROTATION_FACTOR
  const opacity = 1 - Math.min(Math.abs(dragOffset.x) / 500, 0.5)

  return (
    <Card
      ref={cardRef}
      className={cn(
        "relative w-full max-w-sm select-none shadow-2xl overflow-hidden",
        isInteractive && "cursor-grab active:cursor-grabbing",
        className
      )}
      style={{
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
        transition: isDragging ? "none" : "transform 0.3s ease-out",
        opacity,
      }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        const touch = e.touches[0]
        handleStart(touch.clientX, touch.clientY)
      }}
    >
      {/* IMAGE */}
      <div className="relative aspect-[3/4] bg-muted">
        <Image
          src={meme.imageUrl || "/placeholder.svg"}
          alt={meme.caption}
          fill
          className="object-cover pointer-events-none"
          draggable={false}
        />

        {/* FIXED FADE – STRICT PE IMAGINE */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        {/* SWIPE OVERLAYS */}
        {swipeDirection === "right" && Math.abs(dragOffset.x) > 30 && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
            <div className="bg-red-500 text-white px-8 py-4 rounded-full font-bold text-2xl rotate-12 border-4 border-red-500">
              LIKE
            </div>
          </div>
        )}

        {swipeDirection === "left" && Math.abs(dragOffset.x) > 30 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/20">
            <div className="bg-white text-gray-900 px-8 py-4 rounded-full font-bold text-2xl -rotate-12 border-4 border-white">
              NOPE
            </div>
          </div>
        )}
      </div>

      {/* INFO */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary">
            <AvatarImage
              src={meme.author.avatar || "/placeholder.svg"}
              alt={meme.author.name}
            />
            <AvatarFallback>
              {meme.author.name[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">
              {meme.author.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(meme.createdAt).toLocaleDateString()}
            </p>
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

      {/* ACTION BUTTONS */}
      {isInteractive && (
        <>
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-6 p-4">
            <Button
              size="lg"
              variant="outline"
              onClick={() => onSwipe("left")}
              className="h-16 w-16 rounded-full shadow-lg bg-white text-gray-900"
            >
              <X className="h-8 w-8" />
            </Button>

            <Button
              size="lg"
              onClick={() => onSwipe("right")}
              className="h-16 w-16 rounded-full shadow-lg bg-red-500 text-white"
            >
              <Heart className="h-8 w-8" />
            </Button>
          </div>

          <div className="absolute bottom-24 right-6">
            <Button
              size="sm"
              variant="secondary"
              onClick={onComment}
              className="h-10 w-10 rounded-full shadow-lg"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}
