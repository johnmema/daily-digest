import { timingSafeEqual } from 'node:crypto'
export function digestAuthorized(header: string | null): boolean {
  const secret = process.env.DIGEST_PUBLISH_TOKEN
  if (!secret || secret.length < 32 || !header) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const supplied = Buffer.from(header)
  return expected.length === supplied.length && timingSafeEqual(expected, supplied)
}
