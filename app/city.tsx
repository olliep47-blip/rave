import * as Location from 'expo-location'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import CategoryIcon from '../components/CategoryIcon'
import MapView, { Callout, Marker } from 'react-native-maps'
import { supabase } from '../lib/supabase'

const { height } = Dimensions.get('window')

export default function City() {
  const { name, all } = useLocalSearchParams<{ name: string; all?: string }>()
  const [posts, setPosts] = useState<any[]>([])
  const [region, setRegion] = useState<any>(null)
  const [showAll, setShowAll] = useState(all === '1')
  const [activeFilter, setActiveFilter] = useState('All')
  const router = useRouter()

  const setMapRegion = useCallback(async (data: any[]) => {
    const withCoords = data.filter(p => p.latitude && p.longitude)
    if (withCoords.length > 0) {
      setRegion({
        latitude: withCoords.reduce((sum: number, p: any) => sum + p.latitude, 0) / withCoords.length,
        longitude: withCoords.reduce((sum: number, p: any) => sum + p.longitude, 0) / withCoords.length,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      })
    } else {
      try {
        const geocoded = await Location.geocodeAsync(name as string)
        if (geocoded.length > 0) {
          setRegion({
            latitude: geocoded[0].latitude,
            longitude: geocoded[0].longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          })
        }
      } catch (error) {
        console.log('City geocode failed:', error)
      }
    }
  }, [name])

  const fetchCityPosts = useCallback(async (everyone: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('posts')
      .select('*, profiles(username)')
      .ilike('city', name)
      .order('created_at', { ascending: false })

    if (!everyone) {
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      const followingIds = follows?.map(f => f.following_id) || []
      followingIds.push(user.id)
      query = query.in('user_id', followingIds)
    }

    const { data } = await query

    if (data) {
      setPosts(data)
      setMapRegion(data)

      // Backfill coordinates for any posts that are missing them
      const missing = data.filter(p => !p.latitude || !p.longitude)
      if (missing.length > 0) {
        const updated = [...data]
        for (const post of missing) {
          try {
            const geocoded = await Location.geocodeAsync(post.city)
            if (geocoded.length > 0) {
              const lat = geocoded[0].latitude
              const lng = geocoded[0].longitude
              await supabase.from('posts').update({ latitude: lat, longitude: lng }).eq('id', post.id)
              const idx = updated.findIndex(p => p.id === post.id)
              if (idx !== -1) updated[idx] = { ...updated[idx], latitude: lat, longitude: lng }
            }
          } catch {
            console.log('Geocode failed for', post.venue_name)
          }
        }
        setPosts([...updated])
        setMapRegion(updated)
      }
    }
  }, [name, setMapRegion])

  useEffect(() => { fetchCityPosts(showAll) }, [fetchCityPosts, showAll])

  const filteredPosts = activeFilter === 'All'
    ? posts
    : posts.filter(p => p.category?.toLowerCase() === activeFilter.toLowerCase())

  const mappablePosts = filteredPosts.filter(p => p.latitude && p.longitude)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{name}</Text>
      </View>

      {/* Toggle */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, !showAll && styles.toggleBtnActive]}
          onPress={() => setShowAll(false)}
        >
          <Text style={[styles.toggleText, !showAll && styles.toggleTextActive]}>My network</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, showAll && styles.toggleBtnActive]}
          onPress={() => setShowAll(true)}
        >
          <Text style={[styles.toggleText, showAll && styles.toggleTextActive]}>Everyone</Text>
        </TouchableOpacity>
      </View>

      {/* Category filters */}
      <View style={styles.filters}>
        {['All', 'Eat', 'Drink', 'Do'].map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterBtn, activeFilter === cat && styles.filterBtnActive]}
            onPress={() => setActiveFilter(cat)}
          >
            <Text style={[styles.filterText, activeFilter === cat && styles.filterTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {region && <MapView style={styles.map} region={region}>
        {mappablePosts.map(post => (
          <Marker
            key={post.id}
            coordinate={{ latitude: post.latitude, longitude: post.longitude }}
            pinColor={post.on_list ? '#4caf50' : '#999'}
          >
            <Callout onPress={() => router.push({ pathname: '/post-detail', params: { id: post.id } })}>
              <View style={styles.callout}>
                <Text style={styles.calloutVenue}>{post.venue_name}</Text>
                <Text style={styles.calloutMeta}>{post.profiles?.username} · {post.category}</Text>
                {post.on_list && <Text style={styles.calloutList}>Raved</Text>}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>}
      {!region && <View style={styles.mapPlaceholder}><Text style={styles.mapPlaceholderText}>Loading map...</Text></View>}

      <FlatList
        data={filteredPosts}
        keyExtractor={item => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.postRow} onPress={() => router.push({ pathname: '/post-detail', params: { id: item.id } })} activeOpacity={0.85}>
            <View style={[styles.dot, item.on_list ? styles.dotGreen : styles.dotGrey]} />
            <View style={styles.postInfo}>
              <Text style={styles.venueName}>{item.venue_name}</Text>
              <View style={styles.metaRow}>
                <CategoryIcon category={item.category} size={13} />
                <TouchableOpacity onPress={() => router.push({ pathname: '/user-profile', params: { id: item.user_id } })}>
                  <Text style={styles.meta}>@{item.profiles?.username}</Text>
                </TouchableOpacity>
              </View>
              {item.content ? <Text style={styles.content} numberOfLines={2}>{item.content}</Text> : null}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No posts for this city yet.</Text>
          </View>
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
  toggle: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', overflow: 'hidden' },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: '#fff' },
  toggleBtnActive: { backgroundColor: '#000' },
  toggleText: { fontSize: 14, color: '#999' },
  toggleTextActive: { color: '#fff', fontWeight: '600' },
  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fff' },
  filterBtnActive: { backgroundColor: '#000', borderColor: '#000' },
  filterText: { fontSize: 13, color: '#999' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  map: { width: '100%', height: height * 0.3 },
  callout: { width: 180, padding: 4 },
  calloutVenue: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  calloutMeta: { fontSize: 12, color: '#666' },
  calloutList: { fontSize: 12, color: '#4caf50', fontWeight: '600', marginTop: 2 },
  list: { flex: 1 },
  postRow: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12, marginTop: 6 },
  dotGreen: { backgroundColor: '#4caf50' },
  dotGrey: { backgroundColor: '#ddd' },
  postInfo: { flex: 1 },
  venueName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  meta: { fontSize: 13, color: '#999' },
  content: { fontSize: 14, color: '#555' },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#999' },
  mapPlaceholder: { width: '100%', height: height * 0.3, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  mapPlaceholderText: { color: '#999' },
})
