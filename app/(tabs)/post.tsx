import { decode } from 'base64-arraybuffer'
import * as FileSystem from 'expo-file-system/legacy'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { supabase } from '../../lib/supabase'

const CATEGORIES = ['Eat', 'Drink', 'Do']

export default function Post() {
  const [venueName, setVenueName] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [onList, setOnList] = useState<boolean | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const cityDebounce = useRef<any>(null)
  const router = useRouter()

  async function searchCity(text: string) {
    setCity(text)
    if (cityDebounce.current) clearTimeout(cityDebounce.current)
    if (text.length < 2) { setCitySuggestions([]); return }
    cityDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        const names = data.map((item: any) => {
          const a = item.address
          return a.city || a.town || a.village || a.county || a.state || item.display_name.split(',')[0]
        }).filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i)
        setCitySuggestions(names)
      } catch {
        setCitySuggestions([])
      }
    }, 400)
  }

  function selectCity(name: string) {
    setCity(name)
    setCitySuggestions([])
  }

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    })
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri)
      setImages(prev => [...prev, ...uris].slice(0, 5))
    }
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  async function uploadImages(userId: string): Promise<string[]> {
    const urls: string[] = []
    for (const uri of images) {
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      })

      const { error } = await supabase.storage
        .from('posts')
        .upload(fileName, decode(base64), {
          contentType: `image/${ext}`,
        })

      if (error) {
        console.log('Upload error:', error)
      } else {
        const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(fileName)
        urls.push(publicUrl)
      }
    }
    return urls
  }

  async function handlePost() {
    if (!venueName || !city || !category || onList === null) {
      Alert.alert('Missing info', 'Please fill in venue, city, category and whether it makes your list')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const photoUrls = await uploadImages(user?.id || '')

    let latitude = null
    let longitude = null

    try {
      const geocoded = await Location.geocodeAsync(`${venueName}, ${city}`)
      if (geocoded.length > 0) {
        latitude = geocoded[0].latitude
        longitude = geocoded[0].longitude
      }
    } catch (error) {
      console.log('Geocoding failed:', error)
    }

    const { error } = await supabase.from('posts').insert({
      user_id: user?.id,
      venue_name: venueName,
      city,
      category: category.toLowerCase(),
      content,
      on_list: onList,
      photo_urls: photoUrls,
      latitude,
      longitude,
    })

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Posted!', 'Your rave has been saved')
      setVenueName('')
      setCity('')
      setCategory('')
      setContent('')
      setOnList(null)
      setImages([])
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <Text style={styles.header}>New Rave</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <Text style={styles.cancelBtn}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Venue or place</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. The Seahorse, Dartmouth"
        value={venueName}
        onChangeText={setVenueName}
      />

      <Text style={styles.label}>City or area</Text>
      <View style={styles.cityContainer}>
        <TextInput
          style={styles.input}
          placeholder="e.g. South Hams, Paris, Tokyo"
          value={city}
          onChangeText={searchCity}
          autoCapitalize="words"
        />
        {citySuggestions.length > 0 && (
          <View style={styles.dropdown}>
            {citySuggestions.map((name, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.dropdownItem, i < citySuggestions.length - 1 && styles.dropdownBorder]}
                onPress={() => selectCity(name)}
              >
                <Text style={styles.dropdownText}>{name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <Text style={styles.label}>Category</Text>
      <View style={styles.categories}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryBtn, category === cat && styles.categoryBtnActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Photos (up to 5)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
        {images.map((uri, index) => (
          <View key={index} style={styles.photoThumb}>
            <Image source={{ uri }} style={styles.thumbImage} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {images.length < 5 && (
          <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImages}>
            <Text style={styles.addPhotoBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Text style={styles.label}>Your thoughts (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="What did you think? What made it worth it?"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Rave it?</Text>
      <View style={styles.listButtons}>
        <TouchableOpacity
          style={[styles.listBtn, onList === true && styles.listBtnYesActive]}
          onPress={() => setOnList(true)}
        >
          <Text style={[styles.listBtnText, onList === true && styles.listBtnTextActive]}>
            Raved
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.listBtn, onList === false && styles.listBtnNoActive]}
          onPress={() => setOnList(false)}
        >
          <Text style={[styles.listBtnText, onList === false && styles.listBtnTextActive]}>
            Delisted
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handlePost} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Posting...' : 'Post'}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 60, marginBottom: 24 },
  header: { fontSize: 28, fontWeight: 'bold' },
  cancelBtn: { fontSize: 16, color: '#999', paddingBottom: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  cityContainer: { position: 'relative', zIndex: 10 },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  dropdownItem: { padding: 14 },
  dropdownBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dropdownText: { fontSize: 15, color: '#333' },
  textArea: { height: 100, textAlignVertical: 'top' },
  categories: { flexDirection: 'row', gap: 8 },
  categoryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  categoryBtnActive: { backgroundColor: '#000', borderColor: '#000' },
  categoryText: { fontSize: 14, color: '#666' },
  categoryTextActive: { color: '#fff' },
  photoRow: { flexDirection: 'row', marginBottom: 8 },
  photoThumb: { width: 100, height: 100, marginRight: 8, borderRadius: 8, overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  addPhotoBtn: { width: 100, height: 100, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addPhotoBtnText: { fontSize: 14, color: '#999' },
  listButtons: { flexDirection: 'row', gap: 12 },
  listBtn: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  listBtnYesActive: { backgroundColor: '#e8f5e9', borderColor: '#4caf50' },
  listBtnNoActive: { backgroundColor: '#f5f5f5', borderColor: '#999' },
  listBtnText: { fontSize: 15, color: '#666' },
  listBtnTextActive: { color: '#333', fontWeight: '600' },
  button: { backgroundColor: '#000', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
