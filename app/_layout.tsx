import { Session } from '@supabase/supabase-js'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect, useState } from 'react'
import 'react-native-url-polyfill/auto'
import { supabase } from '../lib/supabase'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()
  const segments = useSegments()
  const inAuthGroup = segments[0] === '(auth)'
  const onOnboarding = segments[0] === 'onboarding'

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setInitialized(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!initialized) return

    if (!session && !inAuthGroup && !onOnboarding) {
      router.replace('/(auth)/sign-in')
    } else if (session && (inAuthGroup || onOnboarding)) {
      router.replace('/(tabs)')
    }
  }, [session, initialized, inAuthGroup, onOnboarding, router])

  return <Stack screenOptions={{ headerShown: false }} />
}
