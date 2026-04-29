import { decode } from 'base64-arraybuffer'
import * as FileSystem from 'expo-file-system/legacy'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function Profile() {
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [editingBio, setEditingBio] = useState(false)
  const [bioText, setBioText] = useState('')
  const router = useRouter()

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id)

    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id)

    if (profileData) {
      setProfile(profileData)
      setBioText(profileData.bio || '')
    }
    if (postsData) setPosts(postsData)
    setFollowerCount(followers || 0)
    setFollowingCount(following || 0)
  }

  async function handleAvatarUpload() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (result.canceled) return

    const uri = result.assets[0].uri
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg'
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fileName = `${user.id}/avatar.${ext}`
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any })

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, decode(base64), { contentType: `image/${ext}`, upsert: true })

    if (error) {
      Alert.alert('Upload failed', error.message)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
    const avatarUrl = `${publicUrl}?t=${Date.now()}`

    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id)
    setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrl }))
  }

  async function saveBio() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ bio: bioText }).eq('id', user.id)
    setProfile((prev: any) => ({ ...prev, bio: bioText }))
    setEditingBio(false)
  }

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() }
    ])
  }

  useEffect(() => { fetchProfile() }, [])

  const cities = [...new Set(posts.map(p => p.city))]
  const onListCount = posts.filter(p => p.on_list).length

  const ListHeader = () => (
    <View>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.username}>@{profile?.username}</Text>
        <View style={styles.topBarLinks}>
          <TouchableOpacity onPress={() => router.push('/saved')}>
            <Text style={styles.topBarLink}>My List</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut}>
            <Text style={styles.topBarLink}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar + stats */}
      <View style={styles.profileRow}>
        <TouchableOpacity onPress={handleAvatarUpload} style={styles.avatarContainer}>
          {profile?.avatar_url
            ? <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            : <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {profile?.username?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
          }
          <Text style={styles.avatarEdit}>Edit</Text>
        </TouchableOpacity>

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
      <View style={styles.bioSection}>
        {editingBio ? (
          <View>
            <TextInput
              style={styles.bioInput}
              value={bioText}
              onChangeText={setBioText}
              placeholder="Write a short bio..."
              multiline
              autoFocus
            />
            <View style={styles.bioButtons}>
              <TouchableOpacity onPress={saveBio} style={styles.bioSaveBtn}>
                <Text style={styles.bioSaveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingBio(false)}>
                <Text style={styles.bioCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditingBio(true)}>
            <Text style={profile?.bio ? styles.bioText : styles.bioPlaceholder}>
              {profile?.bio || 'Add a bio...'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionLabel}>Places</Text>
    </View>
  )

  return (
    <View style={styles.container}>
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
                <View key={post.id} style={styles.postRow}>
                  <View style={[styles.listDot, post.on_list ? styles.dotGreen : styles.dotGrey]} />
                  <View style={styles.postInfo}>
                    <Text style={styles.venueName}>{post.venue_name}</Text>
                    <Text style={styles.category}>{post.category}</Text>
                  </View>
                </View>
              ))}
              {cityPosts.length > 3 && (
                <Text style={styles.more}>+{cityPosts.length - 3} more</Text>
              )}
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No raves yet. Start posting!</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60 },
  username: { fontSize: 22, fontWeight: 'bold' },
  topBarLinks: { flexDirection: 'row', gap: 16 },
  topBarLink: { fontSize: 14, color: '#999' },
  signOut: { fontSize: 14, color: '#999' },
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, gap: 16 },
  avatarContainer: { alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 28, fontWeight: 'bold', color: '#999' },
  avatarEdit: { fontSize: 11, color: '#999', marginTop: 4 },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statBlock: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 2 },
  bioSection: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  bioText: { fontSize: 15, color: '#333', lineHeight: 22 },
  bioPlaceholder: { fontSize: 15, color: '#bbb' },
  bioInput: { fontSize: 15, color: '#333', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, lineHeight: 22 },
  bioButtons: { flexDirection: 'row', gap: 16, marginTop: 8, alignItems: 'center' },
  bioSaveBtn: { backgroundColor: '#000', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  bioSaveText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  bioCancelText: { color: '#999', fontSize: 14 },
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
