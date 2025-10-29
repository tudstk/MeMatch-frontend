export interface Meme {
  id: string
  imageUrl: string
  caption: string
  author: {
    id: string
    name: string
    avatar: string
  }
  likes: number
  comments: Comment[]
  createdAt: string
}

export interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  text: string
  createdAt: string
}

export interface UserProfile {
  id: string
  name: string
  avatar: string
  bio: string
  memes: Meme[]
  stats?: {
    totalMemes: number
    totalLikes: number
    followers: number
  }
  hasLikedYou?: boolean
}

// Updated mock data to use real generated images
export const mockMemes: Meme[] = [
  {
    id: "1",
    imageUrl: "/funny-cat-meme.png",
    caption: "When you realize it's Monday tomorrow",
    author: {
      id: "user1",
      name: "MemeKing",
      avatar: "/diverse-group-avatars.png",
    },
    likes: 1234,
    comments: [
      {
        id: "c1",
        userId: "user2",
        userName: "LaughMaster",
        userAvatar: "/diverse-futuristic-avatars.png",
        text: "This is too relatable 😂",
        createdAt: "2024-01-15T10:30:00Z",
      },
    ],
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "2",
    imageUrl: "/programming-meme.png",
    caption: "Debugging at 3 AM be like",
    author: {
      id: "user2",
      name: "CodeJoker",
      avatar: "/diverse-group-futuristic-setting.png",
    },
    likes: 2456,
    comments: [],
    createdAt: "2024-01-14T15:20:00Z",
  },
  {
    id: "3",
    imageUrl: "/dog-meme.jpg",
    caption: "POV: You forgot to save your work",
    author: {
      id: "user3",
      name: "MemeLord",
      avatar: "/diverse-group-futuristic-avatars.png",
    },
    likes: 3789,
    comments: [
      {
        id: "c2",
        userId: "user1",
        userName: "MemeKing",
        userAvatar: "/diverse-group-avatars.png",
        text: "Classic mistake!",
        createdAt: "2024-01-14T12:00:00Z",
      },
    ],
    createdAt: "2024-01-14T11:45:00Z",
  },
  {
    id: "4",
    imageUrl: "/office-meme.jpg",
    caption: "When the meeting could have been an email",
    author: {
      id: "user4",
      name: "WorkHumor",
      avatar: "/diverse-futuristic-avatars.png",
    },
    likes: 5621,
    comments: [],
    createdAt: "2024-01-13T09:15:00Z",
  },
  {
    id: "5",
    imageUrl: "/gaming-meme.png",
    caption: "One more game before bed",
    author: {
      id: "user5",
      name: "GamerMemes",
      avatar: "/diverse-group-avatars.png",
    },
    likes: 4123,
    comments: [
      {
        id: "c3",
        userId: "user3",
        userName: "MemeLord",
        userAvatar: "/diverse-group-futuristic-avatars.png",
        text: "Every single night 🎮",
        createdAt: "2024-01-13T07:30:00Z",
      },
    ],
    createdAt: "2024-01-13T07:00:00Z",
  },
]

export const currentUser: UserProfile = {
  id: "current-user",
  name: "You",
  avatar: "/ai-avatar.png",
  bio: "Meme enthusiast | Spreading laughter one swipe at a time 🎭",
  memes: [
    {
      id: "my1",
      imageUrl: "/your-meme-1.jpg",
      caption: "My first viral meme!",
      author: {
        id: "current-user",
        name: "You",
        avatar: "/ai-avatar.png",
      },
      likes: 892,
      comments: [],
      createdAt: "2024-01-12T14:20:00Z",
    },
    {
      id: "my2",
      imageUrl: "/your-meme-2.jpg",
      caption: "When the code finally works",
      author: {
        id: "current-user",
        name: "You",
        avatar: "/ai-avatar.png",
      },
      likes: 1567,
      comments: [],
      createdAt: "2024-01-11T10:00:00Z",
    },
  ],
  stats: {
    totalMemes: 2,
    totalLikes: 2459,
    followers: 1234,
  },
}

export const mockUserProfile: UserProfile = {
  id: "current-user",
  name: "You",
  avatar: "/ai-avatar.png",
  bio: "Meme enthusiast | Spreading laughter one swipe at a time 🎭",
  memes: [
    {
      id: "my1",
      imageUrl: "/your-meme-1.jpg",
      caption: "My first viral meme!",
      author: {
        id: "current-user",
        name: "You",
        avatar: "/ai-avatar.png",
      },
      likes: 892,
      comments: [],
      createdAt: "2024-01-12T14:20:00Z",
    },
    {
      id: "my2",
      imageUrl: "/your-meme-2.jpg",
      caption: "When the code finally works",
      author: {
        id: "current-user",
        name: "You",
        avatar: "/ai-avatar.png",
      },
      likes: 1567,
      comments: [],
      createdAt: "2024-01-11T10:00:00Z",
    },
  ],
  stats: {
    totalMemes: 2,
    totalLikes: 2459,
    followers: 1234,
  },
}

export const mockUserProfiles: UserProfile[] = [
  {
    id: "user1",
    name: "MemeKing",
    avatar: "/diverse-group-avatars.png",
    bio: "Professional meme curator 👑 | 5 years of making people laugh",
    hasLikedYou: true,
    memes: [
      {
        id: "1",
        imageUrl: "/funny-cat-meme.png",
        caption: "When you realize it's Monday tomorrow",
        author: {
          id: "user1",
          name: "MemeKing",
          avatar: "/diverse-group-avatars.png",
        },
        likes: 1234,
        comments: [
          {
            id: "c1",
            userId: "user2",
            userName: "LaughMaster",
            userAvatar: "/diverse-futuristic-avatars.png",
            text: "This is too relatable 😂",
            createdAt: "2024-01-15T10:30:00Z",
          },
        ],
        createdAt: "2024-01-15T08:00:00Z",
      },
      {
        id: "1b",
        imageUrl: "/dog-meme.jpg",
        caption: "POV: You forgot to save your work",
        author: {
          id: "user1",
          name: "MemeKing",
          avatar: "/diverse-group-avatars.png",
        },
        likes: 3789,
        comments: [],
        createdAt: "2024-01-14T12:00:00Z",
      },
      {
        id: "1c",
        imageUrl: "/office-meme.jpg",
        caption: "When the meeting could have been an email",
        author: {
          id: "user1",
          name: "MemeKing",
          avatar: "/diverse-group-avatars.png",
        },
        likes: 5621,
        comments: [],
        createdAt: "2024-01-13T09:15:00Z",
      },
    ],
    stats: {
      totalMemes: 3,
      totalLikes: 10644,
      followers: 5420,
    },
  },
  {
    id: "user2",
    name: "CodeJoker",
    avatar: "/diverse-group-futuristic-setting.png",
    bio: "Developer by day, meme lord by night 💻",
    hasLikedYou: false,
    memes: [
      {
        id: "2",
        imageUrl: "/programming-meme.png",
        caption: "Debugging at 3 AM be like",
        author: {
          id: "user2",
          name: "CodeJoker",
          avatar: "/diverse-group-futuristic-setting.png",
        },
        likes: 2456,
        comments: [],
        createdAt: "2024-01-14T15:20:00Z",
      },
      {
        id: "2b",
        imageUrl: "/gaming-meme.png",
        caption: "When the code finally compiles",
        author: {
          id: "user2",
          name: "CodeJoker",
          avatar: "/diverse-group-futuristic-setting.png",
        },
        likes: 4123,
        comments: [],
        createdAt: "2024-01-13T07:00:00Z",
      },
    ],
    stats: {
      totalMemes: 2,
      totalLikes: 6579,
      followers: 3210,
    },
  },
  {
    id: "user3",
    name: "MemeLord",
    avatar: "/diverse-group-futuristic-avatars.png",
    bio: "Spreading joy one meme at a time 🎭✨",
    hasLikedYou: true,
    memes: [
      {
        id: "3",
        imageUrl: "/pandora-ocean-scene.png",
        caption: "When you finally understand the joke",
        author: {
          id: "user3",
          name: "MemeLord",
          avatar: "/diverse-group-futuristic-avatars.png",
        },
        likes: 8921,
        comments: [],
        createdAt: "2024-01-12T14:20:00Z",
      },
      {
        id: "3b",
        imageUrl: "/funny-cat-meme.png",
        caption: "Me pretending to understand the meeting",
        author: {
          id: "user3",
          name: "MemeLord",
          avatar: "/diverse-group-futuristic-avatars.png",
        },
        likes: 6543,
        comments: [],
        createdAt: "2024-01-11T10:00:00Z",
      },
      {
        id: "3c",
        imageUrl: "/dog-meme.jpg",
        caption: "When someone says they don't like memes",
        author: {
          id: "user3",
          name: "MemeLord",
          avatar: "/diverse-group-futuristic-avatars.png",
        },
        likes: 7234,
        comments: [],
        createdAt: "2024-01-10T16:30:00Z",
      },
    ],
    stats: {
      totalMemes: 3,
      totalLikes: 22698,
      followers: 8765,
    },
  },
]
