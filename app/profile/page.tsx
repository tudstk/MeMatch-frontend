"use client"

import type React from "react"

import { useState } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MemeDetailModal } from "@/components/meme-detail-modal"
import { currentUser, type Meme } from "@/lib/mock-data"
import { Camera, Upload, Heart, MessageCircle } from "lucide-react"
import Image from "next/image"

export default function ProfilePage() {
  const [user, setUser] = useState(currentUser)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null)
  const [memeDetailOpen, setMemeDetailOpen] = useState(false)
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio)
  const [memeCaption, setMemeCaption] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleSaveProfile = () => {
    setUser({ ...user, name, bio })
    setEditDialogOpen(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleUploadMeme = () => {
    if (!memeCaption.trim()) return

    const newMeme = {
      id: `my${Date.now()}`,
      imageUrl: previewUrl || `/placeholder.svg?height=600&width=500&query=new meme ${Date.now()}`,
      caption: memeCaption,
      author: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      },
      likes: 0,
      comments: [],
      createdAt: new Date().toISOString(),
    }

    setUser({ ...user, memes: [newMeme, ...user.memes] })
    setMemeCaption("")
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadDialogOpen(false)
  }

  const handleMemeClick = (meme: Meme) => {
    setSelectedMeme(meme)
    setMemeDetailOpen(true)
  }

  const handleMemeUpdate = (updatedMeme: Meme) => {
    setUser({
      ...user,
      memes: user.memes.map((m) => (m.id === updatedMeme.id ? updatedMeme : m)),
    })
    setSelectedMeme(updatedMeme)
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="relative h-40 md:h-56 bg-gradient-to-br from-primary to-accent rounded-b-3xl">
          <div className="absolute -bottom-16 md:-bottom-20 left-1/2 md:left-12 lg:left-16 -translate-x-1/2 md:translate-x-0">
            <div className="relative">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 md:border-6 border-background shadow-xl">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="text-3xl md:text-4xl">{user.name[0]}</AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg"
              >
                <Camera className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-20 md:pt-24 space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* Profile info section */}
            <div className="text-center md:text-left md:flex-1 space-y-3 md:space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold">{user.name}</h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">{user.bio}</p>

              <div className="flex items-center justify-center md:justify-start gap-8 md:gap-12 pt-2">
                <div className="text-center md:text-left">
                  <p className="text-3xl md:text-4xl font-bold">{user.memes.length}</p>
                  <p className="text-sm md:text-base text-muted-foreground">Memes</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-3xl md:text-4xl font-bold">{user.memes.reduce((acc, m) => acc + m.likes, 0)}</p>
                  <p className="text-sm md:text-base text-muted-foreground">Likes</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 md:gap-4 md:pt-2">
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 md:flex-none md:px-8 bg-transparent text-base">
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bio</label>
                      <Textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself"
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleSaveProfile} className="w-full">
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex-1 md:flex-none md:px-8 bg-accent hover:bg-accent/90 text-base">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Meme
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload New Meme</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="border-2 border-dashed border-border rounded-lg overflow-hidden">
                      {previewUrl ? (
                        <div className="relative aspect-square">
                          <Image src={previewUrl || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-muted/50 transition-colors">
                          <Upload className="h-12 w-12 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mt-2">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                          <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                        </label>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Caption</label>
                      <Textarea
                        value={memeCaption}
                        onChange={(e) => setMemeCaption(e.target.value)}
                        placeholder="Add a funny caption..."
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleUploadMeme} className="w-full" disabled={!memeCaption.trim()}>
                      Upload
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            <h2 className="text-xl md:text-2xl font-semibold">Your Memes</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3 lg:gap-4">
              {user.memes.map((meme) => (
                <Card
                  key={meme.id}
                  className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleMemeClick(meme)}
                >
                  <div className="relative aspect-square">
                    <Image src={meme.imageUrl || "/placeholder.svg"} alt={meme.caption} fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                      <div className="flex items-center gap-1">
                        <Heart className="h-5 w-5 md:h-6 md:w-6 fill-white" />
                        <span className="text-sm md:text-base font-medium">{meme.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
                        <span className="text-sm md:text-base font-medium">{meme.comments.length}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />

      <MemeDetailModal
        meme={selectedMeme}
        open={memeDetailOpen}
        onOpenChange={setMemeDetailOpen}
        onMemeUpdate={handleMemeUpdate}
      />
    </main>
  )
}
