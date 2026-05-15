type LimitCode =
  | 'TRIAL_MODULE_LIMIT'
  | 'TRIAL_EMAIL_LIMIT'
  | 'VOICE_MONTHLY_LIMIT'
  | 'ADVANCES_PLAN_REQUIRED'

export interface UpgradeDialogPayload {
  code: LimitCode
  message: string
}

type Listener = (payload: UpgradeDialogPayload | null) => void

let _listener: Listener | null = null

export const upgradeDialogStore = {
  show(payload: UpgradeDialogPayload) {
    _listener?.(payload)
  },
  hide() {
    _listener?.(null)
  },
  subscribe(fn: Listener): () => void {
    _listener = fn
    return () => {
      if (_listener === fn) _listener = null
    }
  },
}
