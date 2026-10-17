import { ConvexError } from "convex/values"
import { createElement } from "react"
import { describe, expect, it, vi } from "vitest"
import { ErrorBoundary, type ErrorBoundaryProps } from "./ErrorBoundary"
import { errorMessage } from "./errors"

// The node test environment has no DOM, so these drive the class's own lifecycle methods.
function boundaryOf(props: Partial<ErrorBoundaryProps> = {}): ErrorBoundary {
  return new ErrorBoundary({
    fallback: (error) => createElement("p", null, errorMessage(error)),
    children: createElement("main", null, "The page"),
    ...props,
  })
}

describe("ErrorBoundary", () => {
  it("renders its children while none has thrown", () => {
    expect(boundaryOf().render()).toMatchObject({ type: "main" })
  })

  it("shows the server's message, such as a removed owner's Not allowed, instead of a blank page", () => {
    const boundary = boundaryOf()

    boundary.state = ErrorBoundary.getDerivedStateFromError(new ConvexError("Not allowed"))

    expect(boundary.render()).toMatchObject({ type: "p", props: { children: "Not allowed" } })
  })

  it("drops the caught error when the page changes, and only then", () => {
    const boundary = boundaryOf({ resetKey: "/project/b" })
    const setState = vi.spyOn(boundary, "setState").mockImplementation(() => undefined)

    boundary.state = ErrorBoundary.getDerivedStateFromError(new Error("A render bug"))
    boundary.componentDidUpdate({ ...boundary.props, resetKey: "/project/b" })
    expect(setState).not.toHaveBeenCalled()

    boundary.componentDidUpdate({ ...boundary.props, resetKey: "/project/a" })
    expect(setState).toHaveBeenCalledWith({ caught: null })
  })
})
