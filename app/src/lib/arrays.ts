export function zip<A, B>(first: readonly A[], second: readonly B[]): [A, B][] {
  return first.slice(0, second.length).map((a, index) => [a, second[index] as B])
}
