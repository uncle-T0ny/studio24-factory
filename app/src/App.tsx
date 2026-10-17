import { Authenticated, AuthLoading, Unauthenticated } from "convex/react"
import { lazy, Suspense } from "react"
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import { AnalysisPage } from "./analysis/AnalysisPage"
import { SignInPage } from "./auth/SignInPage"
import { ClientFeedbackPage } from "./clientFeedback/ClientFeedbackPage"
import { FeedbackPage } from "./feedback/FeedbackPage"
import { InterviewPage } from "./interview/InterviewPage"
import { ErrorBoundary } from "./lib/ErrorBoundary"
import { errorMessage } from "./lib/errors"
import { ClientLandingPage } from "./links/ClientLandingPage"
import { FinalPage } from "./links/FinalPage"
import { PrdPage } from "./prd/PrdPage"
import { ProjectPage } from "./projects/ProjectPage"
import { ProjectsPage } from "./projects/ProjectsPage"
import { PrototypePage } from "./prototype/PrototypePage"
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
        <Route path="/c/:token" element={<ClientLandingPage />} />
        <Route path="/c/:token/interview" element={<InterviewPage />} />
        <Route path="/c/:token/prd" element={<PrdPage />} />
        <Route path="/c/:token/analysis" element={<AnalysisPage />} />
        <Route path="/c/:token/prototype" element={<PrototypePage />} />
        <Route path="/c/:token/feedback" element={<ClientFeedbackPage />} />
        <Route path="/c/:token/final" element={<FinalPage />} />
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
