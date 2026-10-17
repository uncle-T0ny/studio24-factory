import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { Navigate } from "react-router-dom"
import { FeedbackButton } from "./FeedbackButton"
import { api } from "../../convex/_generated/api"
import {
  browserSummary,
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_STATUSES,
  FEEDBACK_TYPE_LABELS,
  FeedbackStatus,
  FeedbackType,
  formatSenderTime,
  type FeedbackEntry,
} from "../../convex/lib/feedback"
import { BRAND } from "../app.config"
import { useErrorState } from "../lib/errors"
import { formatTimestamp } from "../lib/formatDate"
import {
  Badge,
  Card,
  CardElement,
  CardHeader,
  EmptyState,
  MetaList,
  PageColumn,
  PageHeader,
  PageMessage,
  SegmentedControl,
  Text,
  TextLink,
  TextSize,
  TextTone,
  Thumbnail,
  Toolbar,
  Tone,
  type Option,
} from "../ui"
import { viewportText } from "./context"

enum Filter {
  All = "all",
  New = "new",
  Done = "done",
}

const FILTER_OPTIONS: Option<Filter>[] = [
  {
    value: Filter.All,
    label: "All",
  },
  {
    value: Filter.New,
    label: "New",
  },
  {
    value: Filter.Done,
    label: "Done",
  },
]

const STATUS_OPTIONS: Option<FeedbackStatus>[] = FEEDBACK_STATUSES.map((status) => ({
  value: status,
  label: FEEDBACK_STATUS_LABELS[status],
}))

const TYPE_TONES: Record<FeedbackType, Tone> = {
  [FeedbackType.Broken]: Tone.Danger,
  [FeedbackType.Feature]: Tone.Accent,
  [FeedbackType.Question]: Tone.Neutral,
}

const EMPTY_TEXT: Record<Filter, string> = {
  [Filter.All]: "No feedback yet.",
  [Filter.New]: "Nothing new. All feedback is done.",
  [Filter.Done]: "Nothing is marked done yet.",
}

function matchesFilter(entry: FeedbackEntry, filter: Filter): boolean {
  if (filter === Filter.All) {
    return true
  }

  return filter === Filter.New
    ? entry.status === FeedbackStatus.New
    : entry.status === FeedbackStatus.Done
}

function countText(entries: readonly FeedbackEntry[]): string {
  const newCount = entries.filter((entry) => entry.status === FeedbackStatus.New).length

  return `${newCount} new · ${entries.length - newCount} done`
}

function useSetStatus() {
  return useMutation(api.feedback.setStatus).withOptimisticUpdate((store, args) => {
    const entries = store.getQuery(api.feedback.list, {})

    if (entries) {
      store.setQuery(
        api.feedback.list,
        {},
        entries.map((entry) =>
          entry.id === args.feedbackId ? { ...entry, status: args.status } : entry,
        ),
      )
    }
  })
}

function FeedbackCard({ entry }: { entry: FeedbackEntry }) {
  const setStatus = useSetStatus()
  const { error, setError, showError } = useErrorState()
  const typeLabel = FEEDBACK_TYPE_LABELS[entry.type]
  const author = entry.authorEmail ?? "Unknown sender"
  const context = entry.context

  const changeStatus = (status: FeedbackStatus) => {
    setError(null)
    setStatus({
      feedbackId: entry.id,
      status,
    }).catch(showError)
  }

  return (
    <Card element={CardElement.Article} label={`${typeLabel} from ${author}`}>
      <CardHeader
        actions={
          <SegmentedControl
            label="Status"
            value={entry.status}
            options={STATUS_OPTIONS}
            onChange={changeStatus}
          />
        }
      >
        <Badge tone={TYPE_TONES[entry.type]}>{typeLabel}</Badge>
        <Text size={TextSize.Small} inline>
          {author}
        </Text>
        <Text size={TextSize.Small} tone={TextTone.Muted} inline>
          {formatTimestamp(entry.createdAt)}
        </Text>
      </CardHeader>
      <Text multiline>{entry.message}</Text>
      {entry.screenshotUrl ? <Thumbnail src={entry.screenshotUrl} alt="Screenshot" /> : null}
      <MetaList
        label="Sent with"
        entries={[
          { label: "Page", value: context.path },
          { label: "Browser", value: browserSummary(context.userAgent) },
          { label: "Window", value: viewportText(context.viewport) },
          { label: "Version", value: context.appVersion },
          { label: "Their time", value: formatSenderTime(context) },
          { label: "User agent", value: context.userAgent },
        ]}
      />
      {error ? (
        <Text tone={TextTone.Danger} size={TextSize.Small} alert>
          {error}
        </Text>
      ) : null}
    </Card>
  )
}

function FeedbackInbox() {
  const entries = useQuery(api.feedback.list, {})
  const [filter, setFilter] = useState(Filter.All)
  const shown = entries?.filter((entry) => matchesFilter(entry, filter)) ?? []

  return (
    <PageColumn>
      <PageHeader
        eyebrow={BRAND}
        title="Feedback"
        actions={
          <Toolbar>
            <TextLink to="/">Back to projects</TextLink>
            <FeedbackButton />
          </Toolbar>
        }
      />
      <Toolbar wrap>
        <SegmentedControl
          label="Show"
          value={filter}
          options={FILTER_OPTIONS}
          onChange={setFilter}
        />
        {entries ? (
          <Text tone={TextTone.Muted} size={TextSize.Small} inline>
            {countText(entries)}
          </Text>
        ) : null}
      </Toolbar>
      {entries === undefined ? <EmptyState>Loading…</EmptyState> : null}
      {entries !== undefined && shown.length === 0 ? (
        <EmptyState>{EMPTY_TEXT[filter]}</EmptyState>
      ) : null}
      {shown.map((entry) => (
        <FeedbackCard key={entry.id} entry={entry} />
      ))}
    </PageColumn>
  )
}

// Every owner's feedback, newest first: every owner sees all of it.
export function FeedbackPage() {
  return (
    <>
      <AuthLoading>
        <PageMessage>Loading…</PageMessage>
      </AuthLoading>
      <Unauthenticated>
        <Navigate to="/" replace />
      </Unauthenticated>
      <Authenticated>
        <FeedbackInbox />
      </Authenticated>
    </>
  )
}
