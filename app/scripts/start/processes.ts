import { spawn, spawnSync, type ChildProcess } from "node:child_process"

const IS_WINDOWS = process.platform === "win32"
const STOP_GRACE_MS = 5_000
const POLL_MS = 500

export interface Started {
  name: string
  child: ChildProcess
  exited: Promise<number | null>
  listeners: Set<(line: string) => void>
}

export interface RunOptions {
  cwd: string
  env: NodeJS.ProcessEnv
  input?: string
}

function prefixLines(name: string, write: (text: string) => void) {
  let pending = ""

  return (chunk: Buffer) => {
    const lines = (pending + chunk.toString()).split(/\r?\n/)

    pending = lines.pop() ?? ""

    for (const line of lines) {
      write(`[${name}] ${line}\n`)
    }
  }
}

export function run(command: string, args: string[], options: RunOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    })
    let stdout = ""
    let stderr = ""

    child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString()))
    child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()))
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(`${args.slice(0, 3).join(" ")} failed (exit ${String(code)}):\n${stderr}`))
      }
    })
    child.stdin.end(options.input ?? "")
  })
}

export function runVisible(
  command: string,
  args: string[],
  cwd: string,
  shell = false,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit", windowsHide: true, shell })

    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${[command, ...args].join(" ")} failed (exit ${String(code)}).`))
      }
    })
  })
}

export function start(name: string, command: string, args: string[], options: RunOptions): Started {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: !IS_WINDOWS,
    windowsHide: true,
  })
  const listeners = new Set<(line: string) => void>()
  const echo = (text: string) => {
    process.stdout.write(text)

    for (const listener of listeners) {
      listener(text)
    }
  }

  child.stdout.on("data", prefixLines(name, echo))
  child.stderr.on("data", prefixLines(name, echo))

  const exited = new Promise<number | null>((resolve) => {
    child.on("error", () => {
      resolve(null)
    })
    child.on("exit", (code) => {
      resolve(code)
    })
  })

  return { name, child, exited, listeners }
}

function isRunning(started: Started): boolean {
  return started.child.exitCode === null && started.child.signalCode === null
}

function signalTree(started: Started, signal: NodeJS.Signals): void {
  const pid = started.child.pid

  if (pid === undefined || !isRunning(started)) {
    return
  }

  try {
    if (IS_WINDOWS) {
      spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" })
    } else {
      process.kill(-pid, signal)
    }
  } catch {
    // Already gone.
  }
}

export async function stop(started: Started): Promise<void> {
  signalTree(started, "SIGTERM")

  const timedOut = await Promise.race([
    started.exited.then(() => false),
    sleep(STOP_GRACE_MS).then(() => true),
  ])

  if (timedOut) {
    signalTree(started, "SIGKILL")
    await started.exited
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function waitForLine(
  started: Started,
  pattern: RegExp,
  timeoutMs: number,
  failure?: RegExp,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const done = (error?: Error) => {
      clearTimeout(timer)
      started.listeners.delete(listener)

      if (error) {
        reject(error)
      } else {
        resolve()
      }
    }
    const listener = (line: string) => {
      if (pattern.test(line)) {
        done()
      } else if (failure?.test(line)) {
        done(new Error(`${started.name} failed; its output above says why.`))
      }
    }
    const timer = setTimeout(() => {
      done(new Error(`${started.name} wasn't ready in ${String(timeoutMs / 1000)} s.`))
    }, timeoutMs)

    started.listeners.add(listener)
    void started.exited.then((code) => {
      done(new Error(`${started.name} exited (code ${String(code)}) before it was ready.`))
    })
  })
}

export async function waitForUrl(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)

      if (response.status === 200) {
        return
      }
    } catch {
      // Not up yet.
    }

    await sleep(POLL_MS)
  }

  throw new Error(`${url} didn't answer 200 in ${String(timeoutMs / 1000)} s.`)
}

export async function answers(url: string): Promise<boolean> {
  try {
    return (await fetch(url)).ok
  } catch {
    return false
  }
}
