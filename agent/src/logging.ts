const PII_PREFIX = "lk.pii."
const INFO_LEVEL = 30
const HOOKS_SYMBOL = "pino.hooks"

type LogMethod = (...args: unknown[]) => void

interface HookedLogger {
  debug: LogMethod
}

interface LogHooks {
  logMethod?: (this: HookedLogger, args: unknown[], method: LogMethod, level: number) => void
}

interface QuietableLogger {
  level: string
}

export function carriesTranscript(args: readonly unknown[]): boolean {
  const fields = args[0]

  if (typeof fields !== "object" || fields === null) {
    return false
  }

  return Object.keys(fields).some((key) => key.startsWith(PII_PREFIX))
}

function isHooks(value: unknown): value is LogHooks {
  return typeof value === "object" && value !== null
}

const quieted = new WeakSet<object>()

export function quietTranscripts(logger: QuietableLogger): boolean {
  if (quieted.has(logger)) {
    return true
  }

  const hooksKey = Object.getOwnPropertySymbols(logger).find(
    (symbol) => symbol.description === HOOKS_SYMBOL,
  )
  const slots = logger as unknown as Record<symbol, unknown>
  const hooks = hooksKey === undefined ? undefined : slots[hooksKey]

  if (hooksKey === undefined || !isHooks(hooks)) {
    return false
  }

  const original = hooks.logMethod
  const quiet: LogHooks = {
    ...hooks,
    logMethod(args, method, level) {
      if (level === INFO_LEVEL && carriesTranscript(args)) {
        this.debug(...args)
        return
      }

      if (original) {
        original.call(this, args, method, level)
        return
      }

      method.apply(this, args)
    },
  }

  slots[hooksKey] = quiet
  // pino builds the level methods with the hook when the level is set.
  const { level } = logger

  logger.level = level
  quieted.add(logger)

  return true
}
