import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function supabaseServer() {
  // Next 15: cookies() returns a Promise<ReadonlyRequestCookies | ResponseCookies>
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // In RSC contexts cookies can be readonly — swallow if so
          try {
            // @ts-ignore - typed readonly in some contexts
            cookieStore.set({ name, value, ...options })
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            // @ts-ignore
            cookieStore.set({ name, value: '', ...options })
          } catch {}
        },
      },
    }
  )

  return supabase
}



