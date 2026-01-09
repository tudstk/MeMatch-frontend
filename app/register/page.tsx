"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Flame, ArrowRight, ArrowLeft } from 'lucide-react'
import { usersApi, type HumourTag } from '@/lib/api'

type Step = 'register' | 'profileDetails' | 'preferences'

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('register')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, user } = useAuth()
  const router = useRouter()

  // Profile details
  const [age, setAge] = useState<number | undefined>(undefined)
  const [gender, setGender] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [humourTags, setHumourTags] = useState<HumourTag[]>([])
  const [allHumourTags, setAllHumourTags] = useState<HumourTag[]>([])

  // Preferences
  const [genderPreference, setGenderPreference] = useState("")
  const [ageMinPreference, setAgeMinPreference] = useState<number>(16)
  const [ageMaxPreference, setAgeMaxPreference] = useState<number>(100)

  useEffect(() => {
    // Load humour tags when we reach profile details step
    if (step === 'profileDetails') {
      loadHumourTags()
    }
  }, [step])

  const loadHumourTags = async () => {
    try {
      const tags = await usersApi.getAllHumourTags()
      setAllHumourTags(tags)
    } catch (err) {
      console.error('Error loading humour tags:', err)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await register(email, username, password)
      setStep('profileDetails')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipProfileDetails = () => {
    setStep('preferences')
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
      setStep('preferences')
    } catch (err: any) {
      setError(err.message || 'Failed to save profile details')
    }
  }

  const handleSkipPreferences = () => {
    router.push('/')
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
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences')
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Flame className="h-8 w-8 text-red-500" />
          <h1 className="text-3xl font-bold">MeMatch</h1>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'register' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'}`}>
            1
          </div>
          <div className={`h-1 w-16 ${step !== 'register' ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'profileDetails' ? 'bg-primary text-primary-foreground' : step === 'preferences' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
            2
          </div>
          <div className={`h-1 w-16 ${step === 'preferences' ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'preferences' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            3
          </div>
        </div>

        {step === 'register' && (
          <>
            <h2 className="text-2xl font-semibold text-center">Create Account</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password (min 6 characters)"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Next'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </>
        )}

        {step === 'profileDetails' && (
          <>
            <h2 className="text-2xl font-semibold text-center">Profile Details</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">Tell us about yourself (optional)</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSkipProfileDetails}
                  className="flex-1"
                >
                  Skip
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSaveProfileDetails}
                  className="flex-1"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'preferences' && (
          <>
            <h2 className="text-2xl font-semibold text-center">Matching Preferences</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">Set your preferences for matches (optional)</p>
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
                    Age Range: {ageMinPreference} - {ageMaxPreference}
                  </label>
                  <Slider
                    value={[ageMinPreference, ageMaxPreference]}
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
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSkipPreferences}
                  className="flex-1"
                >
                  Skip
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSavePreferences}
                  className="flex-1"
                >
                  Complete
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'register' && (
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:underline">
              Login
            </a>
          </div>
        )}
      </Card>
    </div>
  )
}
