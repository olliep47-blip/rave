import CategoryIcon from '../components/CategoryIcon'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '../lib/supabase'

export default function Saved() {
  const [posts, setPosts] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    async function fetchSaved() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('saves')
        .select('post_id, posts(*, profiles(username))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setPosts(data.map((s: any) => s.posts).filter(Boolean))
    }
    fetchSaved()
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My List</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push({ pathname: '/post-detail', params: { id: item.id } })}
            activeOpacity={0.85}
          >
            <View style={[styles.dot, item.on_list ? styles.dotGreen : styles.dotGrey]} />
            <View style={styles.info}>
              <Text style={styles.venueName}>{item.venue_name}</Text>
              <View style={styles.metaRow}>
                <CategoryIcon category={item.category} size={13} />
                <Text style={styles.meta}>{item.city}</Text>
              </View>
              <Text style={styles.username}>@{item.profiles?.username}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Your list is empty.</Text>
            <Text style={styles.emptyHint}>Tap the bookmark on any post to add it to your list.</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 60, gap: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  back: { fontSize: 16, color: '#666' },
  title: { fontSize: 20, fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  dotGreen: { backgroundColor: '#4caf50' },
  dotGrey: { backgroundColor: '#ddd' },
  info: { flex: 1 },
  venueName: { fontSize: 16, fontWeight: '600', marginBottom: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  meta: { fontSize: 13, color: '#999' },
  username: { fontSize: 13, color: '#bbb' },
  arrow: { fontSize: 16, color: '#ccc' },
  empty: { padding: 48, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#666', marginBottom: 6 },
  emptyHint: { fontSize: 14, color: '#aaa', textAlign: 'center' },
})
