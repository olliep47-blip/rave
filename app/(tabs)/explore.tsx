import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import MapView, { Callout, Marker } from 'react-native-maps'
import { supabase } from '../../lib/supabase'

export default function Explore() {
  const [posts, setPosts] = useState<any[]>([])
  const router = useRouter()
  const mapRef = useRef<MapView>(null)

  useEffect(() => {
    async function fetchPosts() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      const followingIds = follows?.map((f: any) => f.following_id) || []
      followingIds.push(user.id)

      const { data } = await supabase
        .from('posts')
        .select('*, profiles(username)')
        .in('user_id', followingIds)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

      if (data) setPosts(data)
    }
    fetchPosts()
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Map</Text>
        <Text style={styles.subtitle}>{posts.length} place{posts.length !== 1 ? 's' : ''} from your network</Text>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 30,
          longitude: 0,
          latitudeDelta: 90,
          longitudeDelta: 120,
        }}
      >
        {posts.map(post => (
          <Marker
            key={post.id}
            coordinate={{ latitude: post.latitude, longitude: post.longitude }}
            pinColor={post.on_list ? '#4caf50' : '#999'}
          >
            <Callout onPress={() => router.push({ pathname: '/post-detail', params: { id: post.id } })}>
              <View style={styles.callout}>
                <Text style={styles.calloutVenue}>{post.venue_name}</Text>
                <Text style={styles.calloutMeta}>{post.profiles?.username} · {post.city}</Text>
                <Text style={styles.calloutCategory}>{post.category}</Text>
                {post.on_list
                  ? <Text style={styles.calloutList}>✓ Raved</Text>
                  : <Text style={styles.calloutNo}>✕ Delisted</Text>
                }
                <Text style={styles.calloutTap}>Tap to view →</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {posts.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No mapped posts yet.</Text>
          <Text style={styles.emptyHint}>Posts will appear here once they have locations.</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: '#999', marginTop: 2 },
  map: { flex: 1 },
  callout: { width: 200, padding: 4 },
  calloutVenue: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  calloutMeta: { fontSize: 12, color: '#666', marginBottom: 2 },
  calloutCategory: { fontSize: 12, color: '#999', marginBottom: 4 },
  calloutList: { fontSize: 12, color: '#2e7d32', fontWeight: '600' },
  calloutNo: { fontSize: 12, color: '#888' },
  calloutTap: { fontSize: 11, color: '#aaa', marginTop: 6 },
  empty: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#666', fontWeight: '600' },
  emptyHint: { fontSize: 13, color: '#aaa', marginTop: 4 },
})
