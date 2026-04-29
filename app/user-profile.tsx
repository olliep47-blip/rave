import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '../lib/supabase'

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const router = useRouter()

  useEffect(() => { fetchAll() }, [id])

  async function fetchAll() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })

    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', id)

    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', id)

    const { data: followCheck } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', id)
      .single()

    if (profileData) setProfile(profileData)
    if (postsData) setPosts(postsData)
    setFollowerCount(followers || 0)
    setFollowingCount(following || 0)
    setIsFollowing(!!followCheck)
  }

  async function toggleFollow() {
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', id)
      setIsFollowing(false)
      setFollowerCount(c => c - 1)
    } else {
      await supabase.from('follows').insert({
        follower_id: currentUserId,
        following_id: id,
      })
      setIsFollowing(true)
      setFollowerCount(c => c + 1)
    }
  }

  const cities = [...new Set(posts.map(p => p.city))]
  const onListCount = posts.filter(p => p.on_list).length

  const ListHeader = () => (
    <View>
      {/* Avatar + stats */}
      <View style={styles.profileRow}>
        <View style={styles.avatarContainer}>
          {profile?.avatar_url
            ? <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            : <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{profile?.username?.[0]?.toUpperCase() || '?'}</Text>
              </View>
          }
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Raves</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>{onListCount}</Text>
            <Text style={styles.statLabel}>Raved</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>{followerCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>

      {/* Bio */}
      {profile?.bio && (
        <Text style={styles.bio}>{profile.bio}</Text>
      )}

      {/* Follow button */}
      {currentUserId !== id && (
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followingBtn]}
          onPress={toggleFollow}
        >
          <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionLabel}>Places</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.username}>@{profile?.username}</Text>
      </View>

      <FlatList
        data={cities}
        keyExtractor={item => item}
        ListHeaderComponent={ListHeader}
        renderItem={({ item: city }) => {
          const cityPosts = posts.filter(p => p.city === city)
          const listed = cityPosts.filter(p => p.on_list).length
          return (
            <TouchableOpacity
              style={styles.citySection}
              onPress={() => router.push({ pathname: '/city', params: { name: city } })}
            >
              <View style={styles.cityHeader}>
                <Text style={styles.cityName}>{city}</Text>
                <Text style={styles.cityArrow}>→</Text>
              </View>
              <Text style={styles.cityMeta}>{cityPosts.length} raves · {listed} raved</Text>
              {cityPosts.slice(0, 3).map(post => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.postRow}
                  onPress={() => router.push({ pathname: '/post-detail', params: { id: post.id } })}
                >
                  <View style={[styles.listDot, post.on_list ? styles.dotGreen : styles.dotGrey]} />
                  <View style={styles.postInfo}>
                    <Text style={styles.venueName}>{post.venue_name}</Text>
                    <Text style={styles.category}>{post.category}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {cityPosts.length > 3 && (
                <Text style={styles.more}>+{cityPosts.length - 3} more</Text>
              )}
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No raves yet.</Text>
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
  username: { fontSize: 20, fontWeight: 'bold' },
  profileRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  avatarContainer: { alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 28, fontWeight: 'bold', color: '#999' },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statBlock: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 2 },
  bio: { fontSize: 15, color: '#333', lineHeight: 22, paddingHorizontal: 16, paddingBottom: 16 },
  followBtn: { marginHorizontal: 16, marginBottom: 8, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#000', alignItems: 'center' },
  followingBtn: { backgroundColor: '#000' },
  followBtnText: { fontSize: 15, fontWeight: '600', color: '#000' },
  followingBtnText: { color: '#fff' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#999', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  citySection: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  cityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cityName: { fontSize: 18, fontWeight: 'bold' },
  cityArrow: { fontSize: 16, color: '#999' },
  cityMeta: { fontSize: 13, color: '#999', marginBottom: 12 },
  postRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  listDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  dotGreen: { backgroundColor: '#4caf50' },
  dotGrey: { backgroundColor: '#ddd' },
  postInfo: { flex: 1 },
  venueName: { fontSize: 15, fontWeight: '500' },
  category: { fontSize: 13, color: '#999', textTransform: 'capitalize' },
  more: { fontSize: 13, color: '#999', marginTop: 4 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 15 },
})
