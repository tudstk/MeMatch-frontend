"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, ImageIcon } from "lucide-react"
import { mockUserProfiles } from "@/lib/mock-data"
import type { UserProfile } from "@/lib/mock-data"

interface Message {
  id: string
  senderId: string
  text: string
  timestamp: Date
  imageUrl?: string
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  const [user, setUser] = useState<UserProfile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const foundUser = mockUserProfiles.find((u) => u.id === userId)
    setUser(foundUser || null)

    // Mock initial messages
    if (foundUser) {
      setMessages([
        {
          id: "1",
          senderId: userId,
          text: `Hey! I loved your memes! 😄`,
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: "2",
          senderId: "me",
          text: "Thanks! Your collection is amazing too!",
          timestamp: new Date(Date.now() - 3000000),
        },
      ])
    }
  }, [userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      senderId: "me",
      text: newMessage,
      timestamp: new Date(),
    }

    setMessages([...messages, message])
    setNewMessage("")

    // Simulate response after 1-2 seconds
    setTimeout(
      () => {
        const responses = [
          "Haha that's hilarious! 😂",
          "I totally agree!",
          "Send me more memes like that!",
          "You have great taste in memes!",
          "That's so relatable 😄",
        ]
        const randomResponse = responses[Math.floor(Math.random() * responses.length)]

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            senderId: userId,
            text: randomResponse,
            timestamp: new Date(),
          },
        ])
      },
      1000 + Math.random() * 1000,
    )
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <main className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10 border-2 border-primary">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="font-semibold">{user.name}</h1>
            <p className="text-xs text-muted-foreground">Active now</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.map((message) => {
            const isMe = message.senderId === "me"
            return (
              <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-2 max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  {!isMe && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex flex-col gap-1">
                    <div
                      className={`rounded-2xl px-4 py-2 ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                    <span className={`text-xs text-muted-foreground ${isMe ? "text-right" : "text-left"}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="icon"
              className="flex-shrink-0 bg-red-500 hover:bg-red-600"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
