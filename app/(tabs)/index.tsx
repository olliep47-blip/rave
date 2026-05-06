import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActionSheetIOS, Alert, FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import CategoryIcon from '../../components/CategoryIcon'
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../constants/theme'
import { supabase } from '../../lib/supabase'

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  async function fetchUnread() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
    setUnreadCount(count || 0)
  }

  async function fetchPosts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    const followingIds = follows?.map(f => f.following_id) || []
    followingIds.push(user.id)

    const { data } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url)')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })

    if (data) setPosts(data)

    const { data: savesData } = await supabase
      .from('saves')
      .select('post_id')
      .eq('user_id', user.id)

    setSavedIds(new Set(savesData?.map(s => s.post_id) || []))
  }

  function showPostOptions(postId: string) {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ['Cancel', 'Edit post', 'Delete post'], destructiveButtonIndex: 2, cancelButtonIndex: 0 },
      buttonIndex => {
        if (buttonIndex === 1) router.push({ pathname: '/post-detail', params: { id: postId, edit: '1' } })
        if (buttonIndex === 2) confirmDelete(postId)
      }
    )
  }

  function confirmDelete(postId: string) {
    Alert.alert('Delete post', "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('posts').delete().eq('id', postId)
        setPosts(prev => prev.filter(p => p.id !== postId))
      }},
    ])
  }

  async function toggleSave(postId: string) {
    if (savedIds.has(postId)) {
      await supabase.from('saves').delete().eq('user_id', currentUserId).eq('post_id', postId)
      setSavedIds(prev => { const next = new Set(prev); next.delete(postId); return next })
    } else {
      await supabase.from('saves').insert({ user_id: currentUserId, post_id: postId })
      setSavedIds(prev => new Set([...prev, postId]))
    }
  }

  async function onRefresh() {
    setRefreshing(true)
    await fetchPosts()
    setRefreshing(false)
  }

  useEffect(() => { fetchPosts(); fetchUnread() }, [])

  function renderPost({ item }: { item: any }) {
    const isSaved = savedIds.has(item.id)
    return (
      <TouchableOpacity style={styles.post} onPress={() => router.push({ pathname: '/post-detail', params: { id: item.id } })} activeOpacity={0.85}>
        <View style={styles.postHeader}>
          <TouchableOpacity style={styles.userRow} onPress={() => router.push({ pathname: '/user-profile', params: { id: item.user_id } })}>
            {item.profiles?.avatar_url
              ? <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatar} />
              : <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{item.profiles?.username?.[0]?.toUpperCase()}</Text>
                </View>
            }
            <Text style={styles.username}>@{item.profiles?.username}</Text>
          </TouchableOpacity>
          <View style={styles.postHeaderRight}>
            <View style={[styles.listBadge, item.on_list ? styles.badgeRaved : styles.badgeDelisted]}>
              <Text style={[styles.listBadgeText, item.on_list ? styles.badgeRavedText : styles.badgeDelistedText]}>
                {item.on_list ? 'Raved' : 'Delisted'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => toggleSave(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color={isSaved ? Colors.accent : Colors.textTertiary} />
            </TouchableOpacity>
            {item.user_id === currentUserId && (
              <TouchableOpacity onPress={() => showPostOptions(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.venueName}>{item.venue_name}</Text>

        <View style={styles.pillRow}>
          <TouchableOpacity style={styles.cityPill} onPress={() => router.push({ pathname: '/city', params: { name: item.city } })}>
            <CategoryIcon category={item.category} size={12} color={Colors.textSecondary} />
            <Text style={styles.cityPillText}>{item.city}</Text>
          </TouchableOpacity>
        </View>

        {item.photo_urls?.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
            {item.photo_urls.map((url: string, index: number) => (
              <Image key={index} source={{ uri: url }} style={styles.photo} />
            ))}
          </ScrollView>
        )}

        {item.content ? <Text style={styles.content}>{item.content}</Text> : null}
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Rave</Text>
        <View style={styles.headerLinks}>
          <TouchableOpacity onPress={() => router.push('/explore-cities')}>
            <Text style={styles.headerLink}>Explore</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/search')}>
            <Text style={styles.headerLink}>Find people</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { router.push('/notifications'); setUnreadCount(0) }} style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.textTertiary} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No posts yet.</Text>
            <Text style={styles.emptyHint}>Follow people or add your first rave.</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 60, paddingBottom: Spacing.md, backgroundColor: Colors.background },
  header: { fontSize: 32, fontWeight: '700', color: Colors.textPrimary, fontFamily: Fonts?.serif },
  headerLinks: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  headerLink: { fontSize: 14, color: Colors.textSecondary },
  bellBtn: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -6, backgroundColor: Colors.accent, borderRadius: Radius.full, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  listContent: { paddingBottom: Spacing.xl },
  post: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.background },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  postHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  avatarPlaceholder: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  username: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  listBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  badgeRaved: { backgroundColor: Colors.ravedLight },
  badgeDelisted: { backgroundColor: Colors.delistedLight },
  listBadgeText: { fontSize: 11, fontWeight: '600' },
  badgeRavedText: { color: Colors.raved },
  badgeDelistedText: { color: Colors.delisted },
  venueName: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, fontFamily: Fonts?.serif, marginBottom: Spacing.xs },
  pillRow: { marginBottom: Spacing.sm },
  cityPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, alignSelf: 'flex-start' },
  cityPillText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  photoRow: { marginVertical: Spacing.sm },
  photo: { width: 220, height: 160, borderRadius: Radius.md, marginRight: Spacing.sm },
  content: { fontSize: 15, color: Colors.textSecondary, lineHeight: 23, marginTop: Spacing.xs },
  empty: { padding: Spacing.xxl, alignItems: 'center' },
  emptyText: { fontSize: 17, fontWeight: '600', color: Colors.textSecondary, fontFamily: Fonts?.serif, marginBottom: Spacing.xs },
  emptyHint: { fontSize: 14, color: Colors.textTertiary, textAlign: 'center' },
})
