// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Types matching backend
export interface User {
  id: number;
  email: string;
  username: string;
  description?: string;
  imageUrl?: string;
}

export interface Meme {
  id: number;
  imageUrl: string;
  caption?: string;
  user: User;
}

export interface Comment {
  id: number;
  content: string;
  user: User;
  meme: Meme;
}

export interface Like {
  id: number;
  user: User;
  meme: Meme;
}

export interface Match {
  id: number;
  user1: User;
  user2: User;
}

export interface AuthResponse {
  token: string;
  type: string;
  userId: number;
  username: string;
  email: string;
}

export interface AuthRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

// Frontend-specific types (mapped from backend)
export interface FrontendMeme {
  id: string;
  imageUrl: string;
  caption: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  likes: number;
  comments: FrontendComment[];
  createdAt: string;
}

export interface FrontendComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface FrontendUserProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  memes: FrontendMeme[];
  stats?: {
    totalMemes: number;
    totalLikes: number;
    followers: number;
  };
  hasLikedYou?: boolean;
}

// Helper function to get auth token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
}

// Helper function to get current user ID
function getCurrentUserId(): number | null {
  if (typeof window === 'undefined') return null;
  const userId = localStorage.getItem('userId');
  return userId ? parseInt(userId, 10) : null;
}

function setCurrentUserId(userId: number | null): void {
  if (typeof window === 'undefined') return;
  if (userId) {
    localStorage.setItem('userId', userId.toString());
  } else {
    localStorage.removeItem('userId');
  }
}

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options.headers,
  });

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// Authentication API
export const authApi = {
  register: async (data: AuthRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAuthToken(response.token);
    setCurrentUserId(response.userId);
    return response;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAuthToken(response.token);
    setCurrentUserId(response.userId);
    return response;
  },

  logout: (): void => {
    setAuthToken(null);
    setCurrentUserId(null);
  },

  getToken: (): string | null => getAuthToken(),
  getCurrentUserId: (): number | null => getCurrentUserId(),
};

// Users API
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    return apiRequest<User[]>('/users');
  },

  getById: async (id: number): Promise<User> => {
    return apiRequest<User>(`/users/${id}`);
  },

  updateProfile: async (id: number, description?: string, profilePictureUrl?: string): Promise<User> => {
    return apiRequest<User>(`/users/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify({ description, profilePictureUrl }),
    });
  },
};

// Memes API
export const memesApi = {
  getAll: async (): Promise<Meme[]> => {
    return apiRequest<Meme[]>('/memes');
  },

  getById: async (id: number): Promise<Meme> => {
    return apiRequest<Meme>(`/memes/${id}`);
  },

  getByUser: async (userId: number): Promise<Meme[]> => {
    return apiRequest<Meme[]>(`/memes/user/${userId}`);
  },

  create: async (userId: number, imageUrl: string, caption: string): Promise<Meme> => {
    return apiRequest<Meme>(`/memes/user/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ imageUrl, caption }),
    });
  },

  update: async (memeId: number, caption: string): Promise<Meme> => {
    return apiRequest<Meme>(`/memes/${memeId}`, {
      method: 'PUT',
      body: JSON.stringify({ caption }),
    });
  },

  delete: async (memeId: number): Promise<void> => {
    return apiRequest<void>(`/memes/${memeId}`, {
      method: 'DELETE',
    });
  },
};

// Comments API
export const commentsApi = {
  getByMeme: async (memeId: number): Promise<Comment[]> => {
    return apiRequest<Comment[]>(`/comments/meme/${memeId}`);
  },

  getById: async (commentId: number): Promise<Comment> => {
    return apiRequest<Comment>(`/comments/${commentId}`);
  },

  create: async (userId: number, memeId: number, content: string): Promise<Comment> => {
    return apiRequest<Comment>(`/comments/meme/${memeId}/user/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  update: async (commentId: number, content: string): Promise<Comment> => {
    return apiRequest<Comment>(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  delete: async (commentId: number): Promise<void> => {
    return apiRequest<void>(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};

// Likes API
export const likesApi = {
  like: async (userId: number, memeId: number): Promise<Like> => {
    return apiRequest<Like>(`/likes/meme/${memeId}/user/${userId}`, {
      method: 'POST',
    });
  },

  unlike: async (userId: number, memeId: number): Promise<void> => {
    return apiRequest<void>(`/likes/meme/${memeId}/user/${userId}`, {
      method: 'DELETE',
    });
  },

  checkStatus: async (userId: number, memeId: number): Promise<{ hasLiked: boolean }> => {
    return apiRequest<{ hasLiked: boolean }>(`/likes/meme/${memeId}/user/${userId}`);
  },

  getCount: async (memeId: number): Promise<{ count: number }> => {
    return apiRequest<{ count: number }>(`/likes/meme/${memeId}/count`);
  },

  hasUserLikedUserMemes: async (likerUserId: number, memeOwnerUserId: number): Promise<{ hasLiked: boolean }> => {
    return apiRequest<{ hasLiked: boolean }>(`/likes/user/${likerUserId}/liked-user/${memeOwnerUserId}`);
  },
};

// Matches API
export const matchesApi = {
  getAll: async (): Promise<Match[]> => {
    return apiRequest<Match[]>('/matches');
  },

  getById: async (id: number): Promise<Match> => {
    return apiRequest<Match>(`/matches/${id}`);
  },

  getByUser: async (userId: number): Promise<Match[]> => {
    return apiRequest<Match[]>(`/matches/user/${userId}`);
  },

  create: async (user1Id: number, user2Id: number): Promise<Match> => {
    return apiRequest<Match>('/matches', {
      method: 'POST',
      body: JSON.stringify({ user1Id, user2Id }),
    });
  },

  likeUser: async (likerUserId: number, likedUserId: number): Promise<{ match: Match; isMatch: boolean }> => {
    return apiRequest<{ match: Match; isMatch: boolean }>(`/matches/like/${likerUserId}/${likedUserId}`, {
      method: 'POST',
    });
  },

  hasUserLikedUser: async (userId: number, otherUserId: number): Promise<{ hasLiked: boolean }> => {
    return apiRequest<{ hasLiked: boolean }>(`/matches/user/${userId}/liked-by/${otherUserId}`);
  },

  delete: async (matchId: number): Promise<void> => {
    return apiRequest<void>(`/matches/${matchId}`, {
      method: 'DELETE',
    });
  },
};

// Messages API
export interface Message {
  id: number;
  match: Match;
  sender: User;
  content: string;
  createdAt: string;
}

export const messagesApi = {
  send: async (matchId: number, userId: number, content: string): Promise<Message> => {
    return apiRequest<Message>(`/messages/match/${matchId}/user/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  getByMatch: async (matchId: number): Promise<Message[]> => {
    return apiRequest<Message[]>(`/messages/match/${matchId}`);
  },

  getById: async (messageId: number): Promise<Message> => {
    return apiRequest<Message>(`/messages/${messageId}`);
  },
};

// Helper functions to transform backend data to frontend format
export function transformMemeToFrontend(meme: Meme, likes: number, comments: FrontendComment[]): FrontendMeme {
  return {
    id: meme.id.toString(),
    imageUrl: meme.imageUrl,
    caption: meme.caption || '',
    author: {
      id: meme.user.id.toString(),
      name: meme.user.username,
      avatar: meme.user.imageUrl || '/placeholder.svg',
    },
    likes,
    comments,
    createdAt: new Date().toISOString(), // Backend doesn't have createdAt, using current time
  };
}

export function transformCommentToFrontend(comment: Comment): FrontendComment {
  return {
    id: comment.id.toString(),
    userId: comment.user.id.toString(),
    userName: comment.user.username,
    userAvatar: comment.user.imageUrl || '/placeholder.svg',
    text: comment.content,
    createdAt: new Date().toISOString(),
  };
}

export function transformUserToFrontendProfile(user: User, memes: FrontendMeme[]): FrontendUserProfile {
  const totalLikes = memes.reduce((sum, meme) => sum + meme.likes, 0);
  return {
    id: user.id.toString(),
    name: user.username,
    avatar: user.imageUrl || '/placeholder.svg',
    bio: user.description || '',
    memes,
    stats: {
      totalMemes: memes.length,
      totalLikes,
      followers: 0, // Backend doesn't have followers yet
    },
  };
}


