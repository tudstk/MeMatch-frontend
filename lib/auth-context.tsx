"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, type AuthResponse } from './api'

interface AuthContextType {
  isAuthenticated: boolean
  user: { id: number; username: string; email: string } | null
  login: (usernameOrEmail: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ id: number; username: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated on mount
    const token = authApi.getToken()
    const userId = authApi.getCurrentUserId()
    
    if (token && userId) {
      // Verify token by fetching user data
      fetchUserData(userId)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserData = async (userId: number) => {
    try {
      const { usersApi } = await import('./api')
      const userData = await usersApi.getById(userId)
      setUser({
        id: userData.id,
        username: userData.username,
        email: userData.email,
      })
      setIsAuthenticated(true)
    } catch (error) {
      // Token might be invalid, clear auth
      authApi.logout()
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (usernameOrEmail: string, password: string) => {
    const { authApi } = await import('./api')
    const response: AuthResponse = await authApi.login({ usernameOrEmail, password })
    setUser({
      id: response.userId,
      username: response.username,
      email: response.email,
    })
    setIsAuthenticated(true)
  }

  const register = async (email: string, username: string, password: string) => {
    const { authApi } = await import('./api')
    const response: AuthResponse = await authApi.register({ email, username, password })
    setUser({
      id: response.userId,
      username: response.username,
      email: response.email,
    })
    setIsAuthenticated(true)
  }

  const logout = () => {
    authApi.logout()
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


