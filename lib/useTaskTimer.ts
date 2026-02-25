import { useState, useEffect, useCallback, useRef } from 'react'

export function useTaskTimer() {
  const [watchedSeconds, setWatchedSeconds] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startTimer = useCallback(() => {
    if (timerRef.current) return
    timerRef.current = setInterval(() => {
      setWatchedSeconds((prev) => prev + 1)
    }, 1000)
    setIsPlaying(true)
  }, [])

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return {
    watchedSeconds,
    isPlaying,
    handlePlaying: startTimer,
    handleStalled: pauseTimer,
    pauseTimer
  }
}