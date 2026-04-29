import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '../lib/supabase'

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*, actor:actor_id(username)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setNotifications(data)

    // Mark all as read
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  function renderMessage(item: any) {
    if (item.type === 'follow') {
      return <Text style={styles.message}><Text style={styles.actor}>@{item.actor?.username}</Text> started following you</Text>
    }
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.row, !item.read && styles.rowUnread]}>
            <View style={styles.dot} />
            <View style={styles.content}>
              {renderMessage(item)}
              <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No notifications yet.</Text>
            <Text style={styles.emptyHint}>You'll see it here when someone follows you.</Text>
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
  row: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'flex-start', gap: 12 },
  rowUnread: { backgroundColor: '#f9f9f9' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#000', marginTop: 6 },
  content: { flex: 1 },
  message: { fontSize: 15, color: '#333', lineHeight: 22 },
  actor: { fontWeight: '700' },
  time: { fontSize: 13, color: '#aaa', marginTop: 3 },
  empty: { padding: 48, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#666', marginBottom: 6 },
  emptyHint: { fontSize: 14, color: '#aaa', textAlign: 'center' },
})
