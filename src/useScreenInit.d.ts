export interface ScreenInitState {
  activeTab?: string
  selectedEventId?: number | string | null
  [key: string]: unknown
}

export function useScreenInit(): ScreenInitState
