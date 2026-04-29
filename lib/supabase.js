import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jrnzyqejqnovusddrrmj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impybnp5cWVqcW5vdnVzZGRycm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjE2NzksImV4cCI6MjA5MjE5NzY3OX0.gtTAtr03_xB1NSMA_ffZINcSou89-qlfczdaOyC4XnA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})