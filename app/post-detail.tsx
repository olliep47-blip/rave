import CategoryIcon from '../components/CategoryIcon'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActionSheetIOS, Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { supabase } from '../lib/supabase'

const { width } = Dimensions.get('window')
const CATEGORIES = ['Eat', 'Drink', 'Do']

export default function PostDetail() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>()
  const [post, setPost] = useState<any>(null)
  const [saved, setSaved] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [editing, setEditing] = useState(edit === '1')

  // Edit state
  const [venueName, setVenueName] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [onList, setOnList] = useState<boolean | null>(null)

  const router = useRouter()

  useEffect(() => {
    async function fetchPost() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      const { data } = await supabase
        .from('posts')
        .select('*, profiles(username)')
        .eq('id', id)
        .single()
      if (data) {
        setPost(data)
        setVenueName(data.venue_name)
        setCity(data.city)
        setCategory(data.category)
        setContent(data.content || '')
        setOnList(data.on_list)
      }

      const { data: saveData } = await supabase
        .from('saves')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', id)
        .single()
      setSaved(!!saveData)
    }
    fetchPost()
  }, [id])

  async function toggleSave() {
    if (saved) {
      await supabase.from('saves').delete()
        .eq('user_id', currentUserId)
        .eq('post_id', id)
      setSaved(false)
    } else {
      await supabase.from('saves').insert({ user_id: currentUserId, post_id: id })
      setSaved(true)
    }
  }

  function showOptions() {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Edit post', 'Delete post'],
        destructiveButtonIndex: 2,
        cancelButtonIndex: 0,
      },
      buttonIndex => {
        if (buttonIndex === 1) setEditing(true)
        if (buttonIndex === 2) confirmDelete()
      }
    )
  }

  function confirmDelete() {
    Alert.alert('Delete post', 'This can\'t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: deletePost },
    ])
  }

  async function deletePost() {
    await supabase.from('posts').delete().eq('id', id)
    router.back()
  }

  async function saveEdit() {
    const { data } = await supabase
      .from('posts')
      .update({
        venue_name: venueName,
        city,
        category,
        content,
        on_list: onList,
      })
      .eq('id', id)
      .select('*, profiles(username)')
      .single()
    if (data) setPost(data)
    setEditing(false)
  }

  if (!post) return (
    <View style={styles.loading}>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  )

  const isOwner = post.user_id === currentUserId
  const hasMap = post.latitude && post.longitude

  // Edit mode
  if (editing) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setEditing(false)}>
            <Text style={styles.back}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.editTitle}>Edit post</Text>
          <TouchableOpacity onPress={saveEdit}>
            <Text style={styles.saveBtn}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.editBody}>
          <Text style={styles.label}>Venue or place</Text>
          <TextInput style={styles.input} value={venueName} onChangeText={setVenueName} />

          <Text style={styles.label}>City or area</Text>
          <TextInput style={styles.input} value={city} onChangeText={setCity} />

          <Text style={styles.label}>Category</Text>
          <View style={styles.categories}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catBtn, category === cat && styles.catBtnActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Your thoughts</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Rave it?</Text>
          <View style={styles.raveButtons}>
            <TouchableOpacity
              style={[styles.raveBtn, onList === true && styles.raveBtnYes]}
              onPress={() => setOnList(true)}
            >
              <Text style={[styles.raveBtnText, onList === true && styles.raveBtnTextActive]}>Raved</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.raveBtn, onList === false && styles.raveBtnNo]}
              onPress={() => setOnList(false)}
            >
              <Text style={[styles.raveBtnText, onList === false && styles.raveBtnTextActive]}>Delisted</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    )
  }

  // View mode
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleSave}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={saved ? '#000' : '#999'}
            />
          </TouchableOpacity>
          {isOwner && (
            <TouchableOpacity onPress={showOptions}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {post.photo_urls?.length > 0 && (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
          {post.photo_urls.map((url: string, index: number) => (
            <Image key={index} source={{ uri: url }} style={styles.photo} />
          ))}
        </ScrollView>
      )}

      <View style={styles.body}>
        <View style={[styles.badge, post.on_list ? styles.badgeGreen : styles.badgeGrey]}>
          <Text style={[styles.badgeText, post.on_list ? styles.badgeTextGreen : styles.badgeTextGrey]}>
            {post.on_list ? '✓ Raved' : '✕ Delisted'}
          </Text>
        </View>

        <Text style={styles.venueName}>{post.venue_name}</Text>
        <View style={styles.metaRow}>
          <CategoryIcon category={post.category} size={15} />
          <Text style={styles.meta}>{post.city}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push({ pathname: '/user-profile', params: { id: post.user_id } })}>
          <Text style={styles.username}>Posted by @{post.profiles?.username}</Text>
        </TouchableOpacity>

        {post.content ? <Text style={styles.content}>{post.content}</Text> : null}

        {hasMap && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={{ latitude: post.latitude, longitude: post.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{ latitude: post.latitude, longitude: post.longitude }}
                pinColor={post.on_list ? '#4caf50' : '#999'}
              />
            </MapView>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#999' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60 },
  back: { fontSize: 16, color: '#666' },
  headerRight: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  editTitle: { fontSize: 17, fontWeight: '600' },
  saveBtn: { fontSize: 16, fontWeight: '700', color: '#000' },
  photoScroll: { width: width },
  photo: { width: width, height: width * 0.75 },
  body: { padding: 16 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 12 },
  badgeGreen: { backgroundColor: '#e8f5e9' },
  badgeGrey: { backgroundColor: '#f5f5f5' },
  badgeText: { fontSize: 13, fontWeight: '600' },
  badgeTextGreen: { color: '#2e7d32' },
  badgeTextGrey: { color: '#888' },
  venueName: { fontSize: 26, fontWeight: 'bold', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  meta: { fontSize: 15, color: '#999' },
  username: { fontSize: 14, color: '#aaa', marginBottom: 16 },
  content: { fontSize: 16, color: '#333', lineHeight: 24, marginBottom: 24 },
  mapContainer: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  map: { width: '100%', height: 200 },
  // Edit mode
  editBody: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  categories: { flexDirection: 'row', gap: 8 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  catBtnActive: { backgroundColor: '#000', borderColor: '#000' },
  catText: { fontSize: 14, color: '#666' },
  catTextActive: { color: '#fff' },
  raveButtons: { flexDirection: 'row', gap: 12 },
  raveBtn: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  raveBtnYes: { backgroundColor: '#e8f5e9', borderColor: '#4caf50' },
  raveBtnNo: { backgroundColor: '#f5f5f5', borderColor: '#999' },
  raveBtnText: { fontSize: 15, color: '#666' },
  raveBtnTextActive: { color: '#333', fontWeight: '600' },
})
