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
import { Slider } from "@/components/ui/slider"
import { Navbar } from "@/components/navbar"
import { MemeDetailModal } from "@/components/meme-detail-modal"
import { useAuth } from "@/lib/auth-context"
import { 
  usersApi, 
  memesApi, 
  transformMemeToFrontend,
  transformCommentToFrontend,
  transformUserToFrontendProfile,
  type FrontendMeme,
  type HumourTag,
  type User
} from "@/lib/api"
import { Camera, Upload, Heart, MessageCircle, Image as ImageIcon, User, Settings } from "lucide-react"
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
  
  // Profile details
  const [age, setAge] = useState<number | undefined>(undefined)
  const [gender, setGender] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [humourTags, setHumourTags] = useState<HumourTag[]>([])
  const [allHumourTags, setAllHumourTags] = useState<HumourTag[]>([])
  // Preferences
  const [genderPreference, setGenderPreference] = useState("")
  const [ageMinPreference, setAgeMinPreference] = useState<number | undefined>(16)
  const [ageMaxPreference, setAgeMaxPreference] = useState<number | undefined>(100)
  
  // Sidebar navigation
  const [activeSection, setActiveSection] = useState<'memes' | 'details' | 'preferences'>('memes')

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        router.push('/login')
      } else {
        loadProfile()
        loadHumourTags()
      }
    }
  }, [isAuthenticated, authLoading, user, router])
  
  const loadHumourTags = async () => {
    try {
      const tags = await usersApi.getAllHumourTags()
      setAllHumourTags(tags)
    } catch (err) {
      console.error('Error loading humour tags:', err)
    }
  }

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
      
      // Load profile details
      setAge(userData.age)
      setGender(userData.gender || "")
      setCity(userData.city || "")
      setCountry(userData.country || "")
      setHumourTags(userData.humourTags || [])
      
      // Load preferences
      setGenderPreference(userData.genderPreference || "")
      setAgeMinPreference(userData.ageMinPreference || 16)
      setAgeMaxPreference(userData.ageMaxPreference || 100)
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

  
  const handleSaveProfileDetails = async () => {
    if (!user) return
    
    try {
      await usersApi.updateProfileDetails(
        user.id,
        age,
        gender || undefined,
        city || undefined,
        country || undefined,
        humourTags
      )
      await loadProfile()
    } catch (err: any) {
      alert(err.message || 'Failed to update profile details')
    }
  }
  
  const handleSavePreferences = async () => {
    if (!user) return
    
    try {
      await usersApi.updatePreferences(
        user.id,
        genderPreference || undefined,
        ageMinPreference,
        ageMaxPreference,
        undefined
      )
      await loadProfile()
    } catch (err: any) {
      alert(err.message || 'Failed to update preferences')
    }
  }
  
  const toggleHumourTag = (tag: HumourTag) => {
    setHumourTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }
  
  const formatHumourTag = (tag: HumourTag): string => {
    return tag.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
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
      <Navbar />
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-card border-r border-border p-6 sticky top-16">
          <div className="flex flex-col items-center mb-8">
            <Avatar className="h-24 w-24 border-4 border-primary shadow-lg mb-4">
              <AvatarImage src={userProfile.avatar || "/placeholder.svg"} alt={userProfile.name} />
              <AvatarFallback className="text-2xl">{userProfile.name[0]}</AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold text-center">{userProfile.name}</h1>
            <p className="text-sm text-muted-foreground text-center mt-1">{userProfile.bio}</p>
            <Dialog open={profilePictureDialogOpen} onOpenChange={setProfilePictureDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Change Photo
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

          <nav className="space-y-2">
            <Button
              variant={activeSection === 'memes' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('memes')}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              My Memes
            </Button>
            <Button
              variant={activeSection === 'details' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('details')}
            >
              <User className="h-4 w-4 mr-2" />
              User Details
            </Button>
            <Button
              variant={activeSection === 'preferences' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('preferences')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </Button>
          </nav>

          <div className="mt-8 pt-8 border-t border-border">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
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
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeSection === 'memes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">My Memes</h2>
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
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
          )}

          {activeSection === 'details' && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">User Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Age</label>
                    <Input 
                      type="number" 
                      value={age || ""} 
                      onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : undefined)} 
                      placeholder="Your age"
                      min="16"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City</label>
                    <Input 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)} 
                      placeholder="Your city"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Country</label>
                    <Input 
                      value={country} 
                      onChange={(e) => setCountry(e.target.value)} 
                      placeholder="Your country"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Humour Tags</label>
                  <div className="flex flex-wrap gap-2 p-4 border rounded-lg min-h-[100px]">
                    {allHumourTags.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Loading tags...</p>
                    ) : (
                      allHumourTags.map(tag => (
                        <Button
                          key={tag}
                          type="button"
                          variant={humourTags.includes(tag) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleHumourTag(tag)}
                          className={humourTags.includes(tag) ? "" : "bg-transparent"}
                        >
                          {formatHumourTag(tag)}
                        </Button>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Select tags that describe your sense of humour</p>
                </div>
                <Button onClick={handleSaveProfileDetails} className="w-full md:w-auto">
                  Save Profile Details
                </Button>
              </div>
            </Card>
          )}

          {activeSection === 'preferences' && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Matching Preferences</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gender Preference</label>
                  <select
                    value={genderPreference}
                    onChange={(e) => setGenderPreference(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="">Any</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Age Range: {ageMinPreference || 16} - {ageMaxPreference || 100}
                    </label>
                    <Slider
                      value={[ageMinPreference || 16, ageMaxPreference || 100]}
                      onValueChange={(values) => {
                        setAgeMinPreference(values[0])
                        setAgeMaxPreference(values[1])
                      }}
                      min={16}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>16</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>
                <Button onClick={handleSavePreferences} className="w-full md:w-auto">
                  Save Preferences
                </Button>
              </div>
            </Card>
          )}
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
