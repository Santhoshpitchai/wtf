import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local for testing
config({ path: path.resolve(process.cwd(), '.env.local') })

// Ensure required environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
}
