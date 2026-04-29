import { Ionicons } from '@expo/vector-icons'

type Props = {
  category: string
  size?: number
  color?: string
}

export function categoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  switch (category?.toLowerCase()) {
    case 'eat': return 'restaurant-outline'
    case 'drink': return 'wine-outline'
    case 'do': return 'ticket-outline'
    default: return 'ellipse-outline'
  }
}

export default function CategoryIcon({ category, size = 14, color = '#999' }: Props) {
  return <Ionicons name={categoryIcon(category)} size={size} color={color} />
}
