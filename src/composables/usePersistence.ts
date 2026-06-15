import { ref, watch, onMounted } from 'vue'
import type { PersistenceOptions } from '@/types'

export function usePersistence<T>(options: PersistenceOptions<T>) {
  const {
    storageKey,
    defaultValue,
    serialize = JSON.stringify,
    deserialize = JSON.parse
  } = options

  const data = ref<T>(defaultValue)
  const isLoaded = ref(false)
  const error = ref<Error | null>(null)

  function load(): T {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        data.value = deserialize(stored)
      } else {
        data.value = defaultValue
      }
      error.value = null
    } catch (e) {
      console.error(`Failed to load ${storageKey}:`, e)
      error.value = e as Error
      data.value = defaultValue
    }
    isLoaded.value = true
    return data.value
  }

  function save(): boolean {
    try {
      localStorage.setItem(storageKey, serialize(data.value))
      error.value = null
      return true
    } catch (e) {
      console.error(`Failed to save ${storageKey}:`, e)
      error.value = e as Error
      return false
    }
  }

  function clear(): boolean {
    try {
      localStorage.removeItem(storageKey)
      data.value = defaultValue
      error.value = null
      return true
    } catch (e) {
      console.error(`Failed to clear ${storageKey}:`, e)
      error.value = e as Error
      return false
    }
  }

  function setValue(value: T): boolean {
    data.value = value
    return save()
  }

  function resetToDefault(): boolean {
    data.value = defaultValue
    return save()
  }

  function exists(): boolean {
    try {
      return localStorage.getItem(storageKey) !== null
    } catch {
      return false
    }
  }

  let unwatch: (() => void) | null = null

  function startAutoSave(delay: number = 300) {
    if (unwatch) return

    let timeoutId: number | null = null
    unwatch = watch(
      () => data.value,
      () => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = window.setTimeout(() => {
          save()
        }, delay)
      },
      { deep: true }
    )
  }

  function stopAutoSave() {
    if (unwatch) {
      unwatch()
      unwatch = null
    }
  }

  onMounted(() => {
    load()
  })

  return {
    data,
    isLoaded,
    error,

    load,
    save,
    clear,
    setValue,
    resetToDefault,
    exists,
    startAutoSave,
    stopAutoSave
  }
}
