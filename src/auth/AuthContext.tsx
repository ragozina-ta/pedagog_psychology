import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { clearTokens, getToken, profileApi, setTokens, type Profile, authApi } from '../api/client'

type AuthCtx = {
  profile: Profile | null
  loading: boolean
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    full_name: string
    school_code?: string
    create_school_name?: string
  }) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setProfile(null)
      setLoading(false)
      return
    }
    try {
      const me = await profileApi.me()
      setProfile(me)
    } catch {
      clearTokens()
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login({ email, password })
    setTokens(tokens.access_token, tokens.refresh_token)
    await refresh()
  }, [refresh])

  const register = useCallback(async (data: {
    email: string
    password: string
    full_name: string
    school_code?: string
    create_school_name?: string
  }) => {
    const tokens = await authApi.register(data)
    setTokens(tokens.access_token, tokens.refresh_token)
    await refresh()
  }, [refresh])

  const logout = useCallback(() => {
    clearTokens()
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({ profile, loading, refresh, login, register, logout }),
    [profile, loading, refresh, login, register, logout],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth outside provider')
  return ctx
}
