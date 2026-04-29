import { useRouter } from 'expo-router'
import { useState } from 'react'
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { supabase } from '../lib/supabase'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const router = useRouter()

  async function search(text: string) {
    setQuery(text)
    if (text.length < 2) { setResults([]); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${text}%`)
      .neq('id', user.id)
      .limit(20)

    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    const followingIds = new Set(follows?.map(f => f.following_id) || [])
    setFollowing(followingIds)
    setResults(profiles || [])
  }

  async function toggleFollow(profileId: string) {
    if (following.has(profileId)) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', profileId)
      setFollowing(prev => { const next = new Set(prev); next.delete(profileId); return next })
    } else {
      await supabase.from('follows').insert({
        follower_id: currentUserId,
        following_id: profileId,
      })
      setFollowing(prev => new Set([...prev, profileId]))
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Find people</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Search by username..."
        value={query}
        onChangeText={search}
        autoFocus
        autoCapitalize="none"
      />
      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <TouchableOpacity onPress={() => router.push({ pathname: '/user-profile', params: { id: item.id } })}>
              <Text style={styles.username}>@{item.username}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.followBtn, following.has(item.id) && styles.followingBtn]}
              onPress={() => toggleFollow(item.id)}
            >
              <Text style={[styles.followBtnText, following.has(item.id) && styles.followingBtnText]}>
                {following.has(item.id) ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          query.length >= 2 ? (
            <Text style={styles.empty}>No users found</Text>
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 60, gap: 16 },
  back: { fontSize: 16, color: '#666' },
  title: { fontSize: 20, fontWeight: 'bold' },
  input: { margin: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  username: { fontSize: 16, fontWeight: '500' },
  followBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#000' },
  followingBtn: { backgroundColor: '#000' },
  followBtnText: { fontSize: 14, fontWeight: '600', color: '#000' },
  followingBtnText: { color: '#fff' },
  empty: { textAlign: 'center', color: '#999', padding: 32 },
})