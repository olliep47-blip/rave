import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    id: '1',
    emoji: '🗺️',
    title: 'Know where\nto go',
    body: 'Rave shows you where your friends and wider network are actually going — in your home city, your next holiday destination, or anywhere in the world.',
  },
  {
    id: '2',
    emoji: '✓',
    title: 'Raved or\nDelisted',
    body: 'Every post is a verdict from someone you trust. Raved means it earned it. Delisted means it didn\'t. No star ratings, no sponsored results — just honest takes.',
  },
  {
    id: '3',
    emoji: '📍',
    title: 'Your list,\nyour way',
    body: 'Save places you want to try to your list. Rave about the ones that deliver. Build a map of everywhere worth going — and share it with the people who matter.',
  },
]

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const router = useRouter()

  async function finish() {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true')
    router.replace('/(auth)/sign-in')
  }

  function next() {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 })
      setCurrentIndex(currentIndex + 1)
    } else {
      finish()
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width)
          setCurrentIndex(index)
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={next}>
          <Text style={styles.nextBtnText}>
            {currentIndex < SLIDES.length - 1 ? 'Next' : 'Get started'}
          </Text>
        </TouchableOpacity>
        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={finish}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  slide: { width, flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emoji: { fontSize: 64, marginBottom: 32 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', lineHeight: 40, marginBottom: 20 },
  body: { fontSize: 17, color: '#666', textAlign: 'center', lineHeight: 26 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ddd' },
  dotActive: { backgroundColor: '#000', width: 20 },
  footer: { paddingHorizontal: 24, paddingBottom: 48, gap: 16 },
  nextBtn: { backgroundColor: '#000', padding: 18, borderRadius: 12, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  skipText: { textAlign: 'center', color: '#aaa', fontSize: 15 },
})
