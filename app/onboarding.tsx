import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Colors, Fonts, Radius, Spacing } from '../constants/theme'

export default function Onboarding() {
  const router = useRouter()

  async function finish() {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true')
    router.replace('/(auth)/sign-in')
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.wordmark}>Rave</Text>
        <Text style={styles.headline}>Learn from your network how to get to know a new place</Text>
        <Text style={styles.body}>
          Where to eat, drink, and what to do — recommended by people whose taste you trust.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={finish}>
          <Text style={styles.btnText}>Get started</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl },
  wordmark: { fontSize: 42, fontWeight: '700', color: Colors.textPrimary, fontFamily: Fonts?.serif, marginBottom: Spacing.xl },
  headline: { fontSize: 32, fontWeight: '700', color: Colors.textPrimary, fontFamily: Fonts?.serif, lineHeight: 42, marginBottom: Spacing.lg },
  body: { fontSize: 17, color: Colors.textSecondary, lineHeight: 26 },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: 52 },
  btn: { backgroundColor: Colors.textPrimary, padding: 18, borderRadius: Radius.md, alignItems: 'center' },
  btnText: { color: Colors.background, fontSize: 17, fontWeight: '700' },
})
