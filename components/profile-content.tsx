"use client"

import { useState } from "react"
import { mockUserProfile } from "@/lib/mock-data"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Label } from "./ui/label"
import { Camera, Upload, Heart } from "lucide-react"
import Image from "next/image"

export function ProfileContent() {
  const [profile, setProfile] = useState(mockUserProfile)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editName, setEditName] = useState(profile.name)
  const [editBio, setEditBio] = useState(profile.bio)

  const handleSaveProfile = () => {
    setProfile({
      ...profile,
      name: editName,
      bio: editBio,
    })
    setIsEditingProfile(false)
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gradient-to-b from-primary/20 to-background pt-8 pb-6 px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.name} />
              <AvatarFallback className="text-2xl">{profile.name[0]}</AvatarFallback>
            </Avatar>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Profile Picture</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-center p-8 border-2 border-dashed border-border rounded-lg">
                    <div className="text-center">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload image</p>
                    </div>
                  </div>
                  <Button className="w-full">Upload</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          </div>

          <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} />
                </div>
                <Button className="w-full" onClick={handleSaveProfile}>
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex items-center justify-around w-full max-w-xs pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.stats.totalMemes}</p>
              <p className="text-xs text-muted-foreground">Memes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.stats.totalLikes}</p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.stats.followers}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Memes</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Meme
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Meme</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-center p-12 border-2 border-dashed border-border rounded-lg bg-muted/50">
                  <div className="text-center">
                    <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">Click to upload meme</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea id="caption" placeholder="Add a funny caption..." rows={3} />
                </div>
                <Button className="w-full">Post Meme</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {profile.memes.map((meme) => (
            <Card key={meme.id} className="relative aspect-square overflow-hidden group cursor-pointer">
              <Image src={meme.imageUrl || "/placeholder.svg"} alt={meme.caption} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex items-center gap-2 text-white">
                  <Heart className="h-5 w-5" />
                  <span className="font-semibold">{meme.likes}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
