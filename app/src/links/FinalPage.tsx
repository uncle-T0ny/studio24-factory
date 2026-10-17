import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react"
import { useParams } from "react-router-dom"
import { api } from "../../convex/_generated/api"
import { SignInPage } from "../auth/SignInPage"
import { Callout, PageColumn, PageHeader, PageMessage, Text, TextTone } from "../ui"

function FinalApp({ token }: { token: string }) {
  const app = useQuery(api.links.finalApp, { token })

  if (app === undefined) {
    return <PageMessage>Loading…</PageMessage>
  }

  return (
    <PageColumn>
      <PageHeader eyebrow="Your app" title={app.title} />
      {app.appUrl ? (
        <a href={app.appUrl}>Open {app.title}</a>
      ) : (
        <Text tone={TextTone.Muted}>Your app is being prepared.</Text>
      )}
    </PageColumn>
  )
}

export function FinalPage() {
  const token = useParams().token ?? ""

  return (
    <>
      <AuthLoading>
        <PageMessage>Loading…</PageMessage>
      </AuthLoading>
      <Unauthenticated>
        <Callout>Sign in to open your app.</Callout>
        <SignInPage />
      </Unauthenticated>
      <Authenticated>
        <FinalApp token={token} />
      </Authenticated>
    </>
  )
}
