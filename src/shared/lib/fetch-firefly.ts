import { createClient } from '@billos/firefly-iii-sdk/client'
import type { Client } from '@billos/firefly-iii-sdk/client'

let cachedClient: Client | null = null
let cachedToken: string | null = null

export function getFireflyClient(token: string): Client {
  if (cachedClient && cachedToken === token) return cachedClient

  cachedClient = createClient({
    baseUrl: '/api',
    auth: token,
  })
  cachedToken = token

  return cachedClient
}
