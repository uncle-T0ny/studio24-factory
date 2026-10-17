// An undo and redo stack of async steps, with a size limit and change listeners (for the
// buttons' enabled state). Each step undoes and redoes itself, so the stack knows nothing of
// what it changes.

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

  // For a step that ended up changing nothing: an edit burst that was cancelled or came back to
  // where it started.
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
