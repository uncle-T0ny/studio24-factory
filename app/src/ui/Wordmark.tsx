export function Wordmark() {
  return (
    <picture className="ui-wordmark">
      <source srcSet="/studio24-dark.svg" media="(prefers-color-scheme: dark)" />
      <img src="/studio24-light.svg" alt="Studio24" />
    </picture>
  )
}
