"use client"

import type React from "react"

import { useState } from "react"
import { Heart, MessageCircle, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Meme } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface MemeCardProps {
  meme: Meme
  onLike: () => void
  onDislike: () => void
  onComment: () => void
  style?: React.CSSProperties
  className?: string
}

export function MemeCard({ meme, onLike, onDislike, onComment, style, className }: MemeCardProps) {
  const [isLiked, setIsLiked] = useState(false)

  const handleLike = () => {
    setIsLiked(true)
    setTimeout(() => {
      onLike()
    }, 300)
  }

  return (
    <Card className={cn("absolute w-full max-w-sm overflow-hidden shadow-2xl", className)} style={style}>
      <div className="relative aspect-[3/4] bg-muted">
        <Image src={meme.imageUrl || "/placeholder.svg"} alt={meme.caption} fill className="object-cover" />
        {isLiked && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 animate-in fade-in zoom-in duration-300">
            <Heart className="h-32 w-32 text-red-500 fill-red-500" />
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
      <>
        <div className="absolute bottom-40 left-0 right-0 flex items-center justify-center gap-6 p-4">
          <Button
            size="lg"
            variant="outline"
            className="h-16 w-16 rounded-full shadow-lg bg-white hover:bg-gray-100 text-gray-900 border-0"
            onClick={onDislike}
          >
            <X className="h-8 w-8" />
          </Button>
          <Button
            size="lg"
            variant="default"
            className="h-16 w-16 rounded-full shadow-lg bg-red-500 hover:bg-red-600 text-white"
            onClick={handleLike}
          >
            <Heart className="h-8 w-8" />
          </Button>
        </div>
        <div className="absolute bottom-24 right-6">
          <Button size="sm" variant="secondary" className="h-10 w-10 rounded-full shadow-lg" onClick={onComment}>
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </>
    </Card>
  )
}
