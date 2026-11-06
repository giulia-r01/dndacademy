import type { Dispatch, SetStateAction } from "react"
import type { TourDemo } from "@/lib/tour-demo"
import type { TourScreen } from "@/lib/tour"

export type DemoScreenProps = {
  screen: TourScreen
  stepId: string
  demo: TourDemo
  setDemo: Dispatch<SetStateAction<TourDemo>>
  notify: (message: string, error?: boolean) => void
  navigate: (screen: TourScreen) => void
  act: (action: string) => void
}
