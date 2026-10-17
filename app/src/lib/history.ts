export interface HistoryStep {
  undo: () => Promise<void>
  redo: () => Promise<void>
}

export interface HistoryState {
  canUndo: boolean
  canRedo: boolean
}

export class History {
  private undoSteps: HistoryStep[] = []
  private redoSteps: HistoryStep[] = []
  private readonly listeners = new Set<() => void>()

  constructor(private readonly limit: number) {}

  get state(): HistoryState {
    return {
      canUndo: this.undoSteps.length > 0,
      canRedo: this.redoSteps.length > 0,
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  push(step: HistoryStep): void {
    this.undoSteps.push(step)

    if (this.undoSteps.length > this.limit) {
      this.undoSteps.shift()
    }

    this.redoSteps = []
    this.notify()
  }

  remove(step: HistoryStep): void {
    this.undoSteps = this.undoSteps.filter((candidate) => candidate !== step)
    this.redoSteps = this.redoSteps.filter((candidate) => candidate !== step)
    this.notify()
  }

  takeUndo(): HistoryStep | null {
    const step = this.undoSteps.pop()

    if (!step) {
      return null
    }

    this.redoSteps.push(step)
    this.notify()

    return step
  }

  takeRedo(): HistoryStep | null {
    const step = this.redoSteps.pop()

    if (!step) {
      return null
    }

    this.undoSteps.push(step)
    this.notify()

    return step
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }
}
