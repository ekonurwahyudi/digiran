'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, User, Mail, Lock, Shield, Eye, EyeOff } from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('user')
  const [avatar, setAvatar] = useState('/avatar.png')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    // Load user profile from API
    console.log('Loading profile from API...')
    console.log('Session data:', session)
    setLoading(true)
    
    fetch('/api/user/profile')
      .then(r => {
        console.log('API response status:', r.status)
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`)
        }
        return r.json()
      })
      .then(data => {
        console.log('Profile data received:', data)
        if (data && !data.error) {
          console.log('Setting name:', data.name)
          console.log('Setting email:', data.email)
          console.log('Setting role:', data.role)
          console.log('Setting avatar:', data.avatar)
          
          setName(data.name || '')
          setEmail(data.email || '')
          setRole(data.role || 'user')
          setAvatar(data.avatar || '/avatar.png')
        } else {
          console.error('Error in response:', data.error)
          // Fallback to session data
          if (session?.user) {
            setName(session.user.name || '')
            setEmail(session.user.email || '')
          }
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Load profile error:', err)
        // Fallback to session data
        if (session?.user) {
          console.log('Using session data as fallback')
          setName(session.user.name || '')
          setEmail(session.user.email || '')
        }
        setLoading(false)
      })
  }, [session])

  // Debug: Log state changes
  useEffect(() => {
    console.log('State updated - name:', name, 'email:', email, 'role:', role)
  }, [name, email, role])

  const handleUpdateProfile = async () => {
    setError('')
    setMessage('')

    if (!name || !email) {
      setError('Nama dan email harus diisi')
      setTimeout(() => setError(''), 3000)
      return
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal update profil')
      }

      const updatedUser = await response.json()
      
      // Update local state
      setName(updatedUser.name)
      setEmail(updatedUser.email)
      setRole(updatedUser.role)

      setMessage('Profil berhasil diupdate!')
      setTimeout(() => {
        setMessage('')
        // Force reload to update navbar
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      console.error('Update error:', err)
      setError(err.message || 'Gagal update profil')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleChangePassword = async () => {
    setError('')
    setMessage('')

    if (!newPassword || !confirmPassword) {
      setError('Password baru harus diisi')
      setTimeout(() => setError(''), 3000)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Password baru tidak cocok')
      setTimeout(() => setError(''), 3000)
      return
    }

    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter')
      setTimeout(() => setError(''), 3000)
      return
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal update password')
      }

      setMessage('Password berhasil diupdate!')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      console.error('Password update error:', err)
      setError(err.message || 'Gagal update password')
      setTimeout(() => setError(''), 3000)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground text-xs md:text-sm">Kelola profil dan keamanan akun Anda</p>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 md:px-4 md:py-3 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 md:px-4 md:py-3 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Profil</CardTitle>
            <CardDescription className="text-xs md:text-sm">Informasi akun Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Image 
                  src={avatar} 
                  alt="Avatar" 
                  width={100} 
                  height={100} 
                  className="rounded-full border-4 border-gray-100 w-20 h-20 md:w-[100px] md:h-[100px]"
                />
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <span className="text-white text-xs font-medium">Ganti</span>
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        // For now, just use a placeholder
                        // In production, you would upload to a storage service
                        const reader = new FileReader()
                        reader.onloadend = async () => {
                          const base64 = reader.result as string
                          setAvatar(base64)
                          
                          // Update avatar in database
                          try {
                            await fetch('/api/user/profile', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ avatar: base64 }),
                            })
                            setMessage('Avatar berhasil diupdate!')
                            setTimeout(() => setMessage(''), 3000)
                          } catch (err) {
                            setError('Gagal update avatar')
                            setTimeout(() => setError(''), 3000)
                          }
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </label>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-base md:text-lg">{name || session?.user?.name}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{email || session?.user?.email}</p>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-2 md:px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    <Shield className="h-3 w-3" />
                    {role === 'admin' ? 'Administrator' : 'User'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Forms */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Update Profile */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Informasi Profil</CardTitle>
              <CardDescription className="text-xs md:text-sm">Update informasi dasar akun Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Memuat data...
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nama Lengkap
                    </Label>
                    <Input 
                      id="name"
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Nama lengkap" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input 
                      id="email"
                      type="email"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="email@example.com" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Role
                    </Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleUpdateProfile}>
                      Simpan Perubahan
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Ubah Password</CardTitle>
              <CardDescription className="text-xs md:text-sm">Update password untuk keamanan akun Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password Baru
                </Label>
                <div className="relative">
                  <Input 
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="Masukkan password baru"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Konfirmasi Password Baru
                </Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Konfirmasi password baru"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleChangePassword}>
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
