"use client"

import { useState, useEffect } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Flame, MessageCircle } from "lucide-react"
import type { UserProfile } from "@/lib/mock-data"
import { mockUserProfiles } from "@/lib/mock-data"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function MatchesPage() {
  const [matchedUsers, setMatchedUsers] = useState<UserProfile[]>([])
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const matches = mockUserProfiles.filter((user) => user.hasLikedYou)
    setMatchedUsers(matches)
  }, [])

  const handleViewProfile = (user: UserProfile) => {
    setSelectedUser(user)
    setProfileDialogOpen(true)
  }

  const handleStartChat = (userId: string) => {
    router.push(`/chat/${userId}`)
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-red-500" />
            <h1 className="text-xl font-bold">Matches</h1>
          </div>
          <div className="text-sm text-muted-foreground">{matchedUsers.length} matches</div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {matchedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Flame className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No matches yet</h2>
            <p className="text-muted-foreground">Start swiping to find your meme soulmates!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matchedUsers.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{user.bio}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{user.stats?.totalMemes} memes</span>
                      <span>{user.stats?.totalLikes.toLocaleString()} likes</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" onClick={() => handleViewProfile(user)} variant="outline">
                      View Profile
                    </Button>
                    <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => handleStartChat(user.id)}>
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
          {selectedUser && (
            <div className="overflow-y-auto max-h-[80vh]">
              {/* Profile Header Section */}
              <div className="flex flex-col items-center text-center p-6 border-b border-border">
                <Avatar className="h-32 w-32 border-4 border-primary mb-4">
                  <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} alt={selectedUser.name} />
                  <AvatarFallback className="text-2xl">{selectedUser.name[0]}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold mb-2">{selectedUser.name}</h2>
                <p className="text-muted-foreground max-w-md mb-4">{selectedUser.bio}</p>

                {/* Stats Row */}
                <div className="flex items-center justify-center gap-8 w-full py-4 border-y border-border my-4">
                  <div className="text-center">
                    <div className="font-bold text-xl">{selectedUser.stats?.totalMemes}</div>
                    <div className="text-sm text-muted-foreground">Memes</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-xl">{selectedUser.stats?.totalLikes.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-xl">{selectedUser.stats?.followers.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                </div>

                <Button
                  className="w-full max-w-md bg-red-500 hover:bg-red-600 h-11"
                  onClick={() => {
                    setProfileDialogOpen(false)
                    handleStartChat(selectedUser.id)
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start a conversation
                </Button>
              </div>

              {/* Memes Grid Section */}
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Memes</h3>
                <div className="grid grid-cols-3 gap-2">
                  {selectedUser.memes.map((meme) => (
                    <div
                      key={meme.id}
                      className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                    >
                      <Image
                        src={meme.imageUrl || "/placeholder.svg"}
                        alt={meme.caption}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                        <p className="text-white text-xs text-center line-clamp-3">{meme.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </main>
  )
}
