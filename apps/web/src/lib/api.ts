export class ApiError extends Error {
  public status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...init })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, typeof body?.error === 'string' ? body.error : 'Request failed')
  }
  return res.json() as Promise<T>
}