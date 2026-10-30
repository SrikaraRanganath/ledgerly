export function stripWildcards(input: string) {
  return input.replace(/[%_]/g, '')
}