import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '../lib/supabase'

export default function ExploreCities() {
  const [cities, setCities] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    async function fetchCities() {
      const { data } = await supabase
        .from('posts')
        .select('city, on_list')
        .order('city')

      if (!data) return

      // Group by city
      const cityMap: Record<string, { total: number; onList: number }> = {}
      for (const post of data) {
        if (!cityMap[post.city]) cityMap[post.city] = { total: 0, onList: 0 }
        cityMap[post.city].total++
        if (post.on_list) cityMap[post.city].onList++
      }

      const sorted = Object.entries(cityMap)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.total - a.total)

      setCities(sorted)
    }
    fetchCities()
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Explore</Text>
      </View>

      <FlatList
        data={cities}
        keyExtractor={item => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cityRow}
            onPress={() => router.push({ pathname: '/city', params: { name: item.name, all: '1' } })}
          >
            <View style={styles.cityInfo}>
              <Text style={styles.cityName}>{item.name}</Text>
              <Text style={styles.cityMeta}>{item.total} rave{item.total !== 1 ? 's' : ''} · {item.onList} raved</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No posts yet anywhere.</Text>
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
  cityRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  cityInfo: { flex: 1 },
  cityName: { fontSize: 17, fontWeight: '600', marginBottom: 3 },
  cityMeta: { fontSize: 13, color: '#999' },
  arrow: { fontSize: 16, color: '#ccc' },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 15 },
})
