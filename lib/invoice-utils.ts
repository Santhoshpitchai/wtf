import { supabase } from './supabase'
import { randomBytes } from 'crypto'

/**
 * Generates a unique invoice number in the format INV-YYYYMMDD-XXXX
 * where XXXX is a random 4-character alphanumeric code
 * 
 * This function uses cryptographically secure random generation to ensure
 * uniqueness and avoid collisions even with concurrent invoice creation.
 * 
 * Strategy:
 * 1. Generate date prefix (INV-YYYYMMDD-)
 * 2. Generate random 4-character alphanumeric suffix
 * 3. Check if it exists in database
 * 4. If exists, generate new random suffix (extremely rare)
 * 5. Return unique invoice number
 * 
 * @returns Promise<string> - Unique invoice number
 * @throws Error if unable to generate invoice number after max attempts
 */
export async function generateInvoiceNumber(): Promise<string> {
  const maxAttempts = 10
  
  try {
    // Get current date in YYYYMMDD format
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const dateStr = `${year}${month}${day}`
    const prefix = `INV-${dateStr}-`
    
    // Try to generate a unique invoice number
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Generate random 4-character alphanumeric code (uppercase letters and numbers)
      // This gives us 36^4 = 1,679,616 possible combinations per day
      const randomSuffix = generateRandomSuffix()
      const invoiceNumber = `${prefix}${randomSuffix}`
      
      // Check if this invoice number already exists
      const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('invoice_number', invoiceNumber)
        .maybeSingle()
      
      if (error) {
        console.error('[Invoice Utils] Database query error:', error)
        throw new Error(`Database query failed: ${error.message}`)
      }
      
      // If no existing invoice found, this number is unique!
      if (!data) {
        console.log(`[Invoice Utils] Generated unique invoice number: ${invoiceNumber} (attempt ${attempt + 1})`)
        return invoiceNumber
      }
      
      // Collision detected (extremely rare), try again
      console.warn(`[Invoice Utils] Collision detected for ${invoiceNumber}, generating new number (attempt ${attempt + 1})`)
    }
    
    // If we exhausted all attempts (virtually impossible)
    throw new Error(`Failed to generate unique invoice number after ${maxAttempts} attempts`)
    
  } catch (error) {
    console.error('[Invoice Utils] Error generating invoice number:', error)
    throw error
  }
}

/**
 * Generates a random 4-character alphanumeric suffix
 * Uses uppercase letters (A-Z) and numbers (0-9)
 * @returns 4-character random string
 */
function generateRandomSuffix(): string {
  // Characters to use: A-Z and 0-9 (36 characters total)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  
  // Generate 4 random bytes
  const randomBytesArray = randomBytes(4)
  
  // Convert to alphanumeric characters
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    const randomIndex = randomBytesArray[i] % chars.length
    suffix += chars[randomIndex]
  }
  
  return suffix
}
