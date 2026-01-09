"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MemeDetailModal } from "@/components/meme-detail-modal"
import { useAuth } from "@/lib/auth-context"
import { 
  usersApi, 
  memesApi, 
  transformMemeToFrontend,
  transformCommentToFrontend,
  transformUserToFrontendProfile,
  type FrontendMeme
} from "@/lib/api"
import { Camera, Upload, Heart, MessageCircle, LogOut } from "lucide-react"
import Image from "next/image"
import { uploadProfilePicture, uploadMemeImage } from "@/lib/firebase-storage"

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [profilePictureDialogOpen, setProfilePictureDialogOpen] = useState(false)
  const [selectedMeme, setSelectedMeme] = useState<FrontendMeme | null>(null)
  const [memeDetailOpen, setMemeDetailOpen] = useState(false)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [memeCaption, setMemeCaption] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        router.push('/login')
      } else {
        loadProfile()
      }
    }
  }, [isAuthenticated, authLoading, user, router])

  const loadProfile = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const userData = await usersApi.getById(user.id)
      const memes = await memesApi.getByUser(user.id)
      
      // Transform memes
      const transformedMemes = await Promise.all(
        memes.map(async (meme) => {
          try {
            const { likesApi, commentsApi } = await import('@/lib/api')
            const [likeCountRes, comments] = await Promise.all([
              likesApi.getCount(meme.id),
              commentsApi.getByMeme(meme.id)
            ])
            const frontendComments = comments.map(transformCommentToFrontend)
            return transformMemeToFrontend(meme, likeCountRes.count, frontendComments)
          } catch (err) {
            return transformMemeToFrontend(meme, 0, [])
          }
        })
      )
      
      const profile = transformUserToFrontendProfile(userData, transformedMemes)
      setUserProfile(profile)
      setName(profile.name)
      setBio(profile.bio)
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    
    try {
      let profilePictureUrl = userProfile?.avatar
      
      // Upload profile picture if a new file is selected
      if (selectedFile) {
        setUploading(true)
        setUploadProgress(0)
        try {
          profilePictureUrl = await uploadProfilePicture(user.id, selectedFile)
          setUploadProgress(100)
        } catch (err: any) {
          alert(err.message || 'Failed to upload profile picture')
          setUploading(false)
          return
        }
        setUploading(false)
      }
      
      await usersApi.updateProfile(user.id, bio, profilePictureUrl)
      setSelectedFile(null)
      setPreviewUrl(null)
      await loadProfile()
      setEditDialogOpen(false)
      setProfilePictureDialogOpen(false)
    } catch (err: any) {
      alert(err.message || 'Failed to update profile')
    }
  }


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleUploadMeme = async () => {
    if (!memeCaption.trim() || !user || !selectedFile) return

    try {
      setUploading(true)
      setUploadProgress(0)
      
      // Upload meme image to Firebase
      const imageUrl = await uploadMemeImage(user.id, selectedFile)
      setUploadProgress(100)
      
      // Create meme with Firebase URL
      await memesApi.create(user.id, imageUrl, memeCaption)
      
      setMemeCaption("")
      setSelectedFile(null)
      setPreviewUrl(null)
      setUploadDialogOpen(false)
      setUploading(false)
      setUploadProgress(0)
      await loadProfile()
    } catch (err: any) {
      setUploading(false)
      setUploadProgress(0)
      alert(err.message || 'Failed to upload meme')
    }
  }

  const handleMemeClick = (meme: FrontendMeme) => {
    setSelectedMeme(meme)
    setMemeDetailOpen(true)
  }

  const handleMemeUpdate = (updatedMeme: FrontendMeme) => {
    setUserProfile({
      ...userProfile,
      memes: userProfile.memes.map((m: FrontendMeme) => (m.id === updatedMeme.id ? updatedMeme : m)),
    })
    setSelectedMeme(updatedMeme)
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }


  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!userProfile) {
    return null
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="relative h-40 md:h-56 bg-gradient-to-br from-primary to-accent rounded-b-3xl">
          <div className="absolute -bottom-16 md:-bottom-20 left-1/2 md:left-12 lg:left-16 -translate-x-1/2 md:translate-x-0">
            <div className="relative">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 md:border-6 border-background shadow-xl">
                <AvatarImage src={userProfile.avatar || "/placeholder.svg"} alt={userProfile.name} />
                <AvatarFallback className="text-3xl md:text-4xl">{userProfile.name[0]}</AvatarFallback>
              </Avatar>
              <Dialog open={profilePictureDialogOpen} onOpenChange={setProfilePictureDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg"
                  >
                    <Camera className="h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Profile Picture</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {previewUrl ? (
                      <div className="relative aspect-square rounded-lg overflow-hidden">
                        <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-8 border-2 border-dashed border-border rounded-lg">
                        <div className="text-center">
                          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-2">Click to upload image</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setSelectedFile(file)
                          const url = URL.createObjectURL(file)
                          setPreviewUrl(url)
                        }
                      }}
                      className="hidden"
                      id="profile-picture-upload"
                    />
                    <label
                      htmlFor="profile-picture-upload"
                      className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded cursor-pointer hover:bg-primary/90 text-center"
                    >
                      {previewUrl ? 'Change Image' : 'Select Image'}
                    </label>
                    {previewUrl && (
                      <Button 
                        className="w-full" 
                        onClick={handleSaveProfile}
                        disabled={uploading}
                      >
                        {uploading ? `Uploading... ${uploadProgress}%` : 'Save Profile Picture'}
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="pt-20 md:pt-24 space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="text-center md:text-left md:flex-1 space-y-3 md:space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold">{userProfile.name}</h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">{userProfile.bio}</p>

              <div className="flex items-center justify-center md:justify-start gap-8 md:gap-12 pt-2">
                <div className="text-center md:text-left">
                  <p className="text-3xl md:text-4xl font-bold">{userProfile.memes.length}</p>
                  <p className="text-sm md:text-base text-muted-foreground">Memes</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-3xl md:text-4xl font-bold">{userProfile.memes.reduce((acc: number, m: FrontendMeme) => acc + m.likes, 0)}</p>
                  <p className="text-sm md:text-base text-muted-foreground">Likes</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 md:gap-4 md:pt-2 justify-center md:justify-end">
              <Button 
                variant="outline" 
                className="flex-1 md:flex-none md:px-8 bg-transparent text-base text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
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
                    <Button 
                      onClick={handleUploadMeme} 
                      className="w-full" 
                      disabled={!memeCaption.trim() || !selectedFile || uploading}
                    >
                      {uploading ? `Uploading... ${uploadProgress}%` : 'Upload'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            <h2 className="text-xl md:text-2xl font-semibold">Your Memes</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3 lg:gap-4">
              {userProfile.memes.map((meme: FrontendMeme) => (
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
