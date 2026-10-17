import { describe, expect, it } from "vitest"
import { History, type HistoryStep } from "./history"

function recordingStep(log: string[], name: string): HistoryStep {
  return {
    undo: async () => {
      log.push(`undo ${name}`)
    },
    redo: async () => {
      log.push(`redo ${name}`)
    },
  }
}

describe("History", () => {
  it("starts empty", () => {
    const history = new History(10)

    expect(history.state).toEqual({
      canUndo: false,
      canRedo: false,
    })
    expect(history.takeUndo()).toBeNull()
    expect(history.takeRedo()).toBeNull()
  })

  it("undoes newest first and redoes what it undid", async () => {
    const log: string[] = []
    const history = new History(10)

    history.push(recordingStep(log, "a"))
    history.push(recordingStep(log, "b"))
    await history.takeUndo()?.undo()
    await history.takeUndo()?.undo()

    expect(history.state).toEqual({
      canUndo: false,
      canRedo: true,
    })

    await history.takeRedo()?.redo()

    expect(log).toEqual(["undo b", "undo a", "redo a"])
    expect(history.state).toEqual({
      canUndo: true,
      canRedo: true,
    })
  })

  it("forgets the redo steps when a new action is pushed", () => {
    const log: string[] = []
    const history = new History(10)

    history.push(recordingStep(log, "a"))
    history.takeUndo()
    history.push(recordingStep(log, "b"))

    expect(history.state.canRedo).toBe(false)
  })

  it("keeps only the newest steps up to its limit", async () => {
    const log: string[] = []
    const history = new History(2)

    history.push(recordingStep(log, "a"))
    history.push(recordingStep(log, "b"))
    history.push(recordingStep(log, "c"))
    await history.takeUndo()?.undo()
    await history.takeUndo()?.undo()

    expect(history.takeUndo()).toBeNull()
    expect(log).toEqual(["undo c", "undo b"])
  })

  it("drops a cancelled step and tells its listeners", () => {
    const log: string[] = []
    const history = new History(10)
    const step = recordingStep(log, "a")
    let notified = 0

    history.subscribe(() => {
      notified += 1
    })
    history.push(step)
    history.remove(step)

    expect(history.state.canUndo).toBe(false)
    expect(notified).toBe(2)
  })
})
