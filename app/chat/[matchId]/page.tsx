"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { messagesApi, matchesApi, usersApi, type Message } from "@/lib/api"

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const matchIdParam = params?.matchId as string | undefined
  const matchId = matchIdParam ? parseInt(matchIdParam) : null
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [otherUser, setOtherUser] = useState<{ id: number; username: string; imageUrl?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user || !matchId || isNaN(matchId)) {
      setLoading(false)
      return
    }
    
    loadChatData()
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000)
    
    return () => clearInterval(interval)
  }, [user, matchId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadChatData = async () => {
    if (!user || !matchId) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Load match to get the other user
      const match = await matchesApi.getById(matchId)
      const otherUserId = match.user1.id === user.id ? match.user2.id : match.user1.id
      const otherUserData = await usersApi.getById(otherUserId)
      setOtherUser({
        id: otherUserData.id,
        username: otherUserData.username,
        imageUrl: otherUserData.imageUrl,
      })
      
      // Load messages
      await loadMessages()
    } catch (err: any) {
      console.error('Error loading chat data:', err)
      setError(err.message || 'Failed to load chat')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    if (!matchId) return
    
    try {
      const loadedMessages = await messagesApi.getByMatch(matchId)
      setMessages(loadedMessages)
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !matchId || sending) return

    try {
      setSending(true)
      const sentMessage = await messagesApi.send(matchId, user.id, newMessage.trim())
      setMessages((prev) => [...prev, sentMessage])
      setNewMessage("")
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (!matchIdParam) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No match ID provided</p>
          <Button onClick={() => router.push('/matches')}>Go to Matches</Button>
        </div>
      </div>
    )
  }

  if (!matchId || isNaN(matchId)) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Invalid match ID: {matchIdParam}</p>
          <Button onClick={() => router.push('/matches')}>Go to Matches</Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={() => router.push('/matches')}>Go to Matches</Button>
        </div>
      </div>
    )
  }

  if (loading || !otherUser) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    )
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
            <AvatarImage src={otherUser.imageUrl || "/placeholder.svg"} alt={otherUser.username} />
            <AvatarFallback>{otherUser.username[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="font-semibold">{otherUser.username}</h1>
            <p className="text-xs text-muted-foreground">Matched</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-muted-foreground mb-2">No messages yet</p>
              <p className="text-sm text-muted-foreground">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isMe = message.sender.id === user?.id
              const messageDate = new Date(message.createdAt)
              
              return (
                <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-2 max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    {!isMe && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={otherUser.imageUrl || "/placeholder.svg"} alt={otherUser.username} />
                        <AvatarFallback>{otherUser.username[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex flex-col gap-1">
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isMe 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      <span className={`text-xs text-muted-foreground ${isMe ? "text-right" : "text-left"}`}>
                        {messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
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
              disabled={sending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
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
