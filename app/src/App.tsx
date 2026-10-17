import { Authenticated, AuthLoading, Unauthenticated } from "convex/react"
import { lazy, Suspense } from "react"
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import { SignInPage } from "./auth/SignInPage"
import { FeedbackPage } from "./feedback/FeedbackPage"
import { ErrorBoundary } from "./lib/ErrorBoundary"
import { errorMessage } from "./lib/errors"
import { ProjectPage } from "./projects/ProjectPage"
import { ProjectsPage } from "./projects/ProjectsPage"
import { SharedProjectPage } from "./projects/SharedProjectPage"
import { Button, PageMessage } from "./ui"

const UiKitPage = lazy(() => import("./ui/UiKitPage"))

function HomePage() {
  return (
    <>
      <AuthLoading>
        <PageMessage>Loading…</PageMessage>
      </AuthLoading>
      <Unauthenticated>
        <SignInPage />
      </Unauthenticated>
      <Authenticated>
        <ProjectsPage />
      </Authenticated>
    </>
  )
}

// The kit page is a working tool for the owner, so it sits behind sign-in like the projects.
function UiKitRoute() {
  return (
    <>
      <AuthLoading>
        <PageMessage>Loading…</PageMessage>
      </AuthLoading>
      <Unauthenticated>
        <SignInPage />
      </Unauthenticated>
      <Authenticated>
        <Suspense fallback={<PageMessage>Loading…</PageMessage>}>
          <UiKitPage />
        </Suspense>
      </Authenticated>
    </>
  )
}

function CrashMessage({ error }: { error: unknown }) {
  return (
    <PageMessage action={<Button onClick={() => window.location.reload()}>Reload the page</Button>}>
      {errorMessage(error)}
    </PageMessage>
  )
}

function AppRoutes() {
  const location = useLocation()

  return (
    <ErrorBoundary
      resetKey={location.pathname}
      fallback={(error) => <CrashMessage error={error} />}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/project/:id" element={<ProjectPage />} />
        <Route path="/p/:token" element={<SharedProjectPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/ui-kit" element={<UiKitRoute />} />
        <Route path="*" element={<PageMessage>Page not found.</PageMessage>} />
      </Routes>
    </ErrorBoundary>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
