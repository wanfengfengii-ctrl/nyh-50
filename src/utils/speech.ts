import { ref, watch } from 'vue'
import { VOICE_ENABLED_DEFAULT } from '@/constants'

const VOICE_STORAGE_KEY = 'scaleTrainer_voiceEnabled'

function loadVoiceState(): boolean {
  try {
    const stored = localStorage.getItem(VOICE_STORAGE_KEY)
    if (stored !== null) {
      return stored === 'true'
    }
  } catch (e) {
    console.error('Failed to load voice state:', e)
  }
  return VOICE_ENABLED_DEFAULT
}

export const isVoiceEnabled = ref(loadVoiceState())

watch(isVoiceEnabled, (val) => {
  try {
    localStorage.setItem(VOICE_STORAGE_KEY, String(val))
  } catch (e) {
    console.error('Failed to save voice state:', e)
  }
})

let synth: SpeechSynthesis | null = null
let currentUtterance: SpeechSynthesisUtterance | null = null

function getSynth(): SpeechSynthesis | null {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    if (!synth) {
      synth = window.speechSynthesis
    }
    return synth
  }
  return null
}

export function speak(text: string, options?: {
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
  priority?: boolean
}): Promise<void> {
  return new Promise((resolve) => {
    if (!isVoiceEnabled.value) {
      resolve()
      return
    }

    const s = getSynth()
    if (!s) {
      resolve()
      return
    }

    if (currentUtterance && !options?.priority) {
      resolve()
      return
    }

    if (options?.priority && s.speaking) {
      s.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options?.rate ?? 0.95
    utterance.pitch = options?.pitch ?? 1
    utterance.volume = options?.volume ?? 1
    utterance.lang = options?.lang ?? 'zh-CN'

    utterance.onend = () => {
      currentUtterance = null
      resolve()
    }

    utterance.onerror = () => {
      currentUtterance = null
      resolve()
    }

    currentUtterance = utterance
    s.speak(utterance)
  })
}

export function stopSpeaking(): void {
  const s = getSynth()
  if (s) {
    s.cancel()
  }
  currentUtterance = null
}

export function toggleVoice(): boolean {
  isVoiceEnabled.value = !isVoiceEnabled.value
  if (!isVoiceEnabled.value) {
    stopSpeaking()
  }
  return isVoiceEnabled.value
}

export function speakStepInstruction(stepTitle: string, instruction: string): Promise<void> {
  return speak(`${stepTitle}。${instruction}`, { priority: true })
}

export function speakFeedback(level: string, message: string): Promise<void> {
  const prefix = level === 'success' ? '很好！' : level === 'warning' ? '注意：' : level === 'error' ? '不对哦，' : ''
  return speak(`${prefix}${message}`)
}
