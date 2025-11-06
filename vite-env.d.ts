/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ACCESS_PASSWORD: string
  readonly VITE_ACTIVATION_CODES: string
  readonly VITE_FREE_DAILY_LIMIT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}