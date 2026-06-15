/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@vicons/ionicons5' {
  export const ScaleOutline: any
  export const PlayOutline: any
  export const TrophyOutline: any
  export const BookOutline: any
  export const CheckmarkCircleOutline: any
  export const AlertCircleOutline: any
  export const ArrowUndoOutline: any
  export const ArrowRedoOutline: any
  export const RefreshOutline: any
  export const TimeOutline: any
  export const SadOutline: any
}
