import { PropsWithChildren } from 'react'
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native'

type Region = {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

type MapViewProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>
  initialRegion?: Region
  region?: Region
  scrollEnabled?: boolean
  zoomEnabled?: boolean
}>

type MarkerProps = PropsWithChildren<{
  coordinate: {
    latitude: number
    longitude: number
  }
  pinColor?: string
}>

type CalloutProps = PropsWithChildren<{
  onPress?: () => void
}>

export function MapView({ style, children }: MapViewProps) {
  return (
    <View style={[styles.mapFallback, style]}>
      <Text style={styles.mapFallbackTitle}>Map preview unavailable on web</Text>
      <Text style={styles.mapFallbackText}>Open this screen on iOS or Android to view the interactive map.</Text>
      {children}
    </View>
  )
}

export function Marker(_props: MarkerProps) {
  return null
}

export function Callout({ children, onPress }: CalloutProps) {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      {children}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  mapFallback: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mapFallbackTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  mapFallbackText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
})
