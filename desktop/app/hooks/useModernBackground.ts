import { useEffect, useState, useCallback } from 'react'
import { genModernBackground } from '@canvas/modern-background'

interface ModernBackgroundProps {
  primaryColor: string
  secondaryColor: string
  disablePattern?: boolean
  opacity?: number
}

const useModernBackground = ({ 
  primaryColor, 
  secondaryColor, 
  disablePattern, 
  opacity 
}: ModernBackgroundProps): string | null => {
  const [background, setBackground] = useState<string | null>(null)

  const genBackground = useCallback(async () => {
    if (!primaryColor || !secondaryColor) return
    const backgroundBase64 = await genModernBackground({
      primaryColor,
      secondaryColor,
      disablePattern,
      opacity
    })
    setBackground(backgroundBase64)
  }, [primaryColor, secondaryColor])

  useEffect(() => {
    genBackground()
  }, [genBackground])

  return background
}

export default useModernBackground;
