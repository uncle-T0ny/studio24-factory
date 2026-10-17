import { Authenticated, Unauthenticated, useQuery } from "convex/react"
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
      <Text tone={TextTone.Muted}>Your developer hands the app over here.</Text>
    </PageColumn>
  )
}

export function FinalPage() {
  const token = useParams().token ?? ""

  return (
    <>
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
