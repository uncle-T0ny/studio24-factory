// Pairs two lists by position, up to the shorter one's length: the ids a batch of mutations
// returned with the inputs it was given, the files of an upload with their results.
export function zip<A, B>(first: readonly A[], second: readonly B[]): [A, B][] {
  return first.slice(0, second.length).map((a, index) => [a, second[index] as B])
}
