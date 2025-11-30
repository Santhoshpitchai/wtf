import { supabase } from './supabase'

/**
 * Generates a unique invoice number in the format INV-YYYYMMDD-XXXX
 * where XXXX is a sequential 4-digit number for that day
 * 
 * This function uses a simple approach that relies on the database unique constraint
 * to handle race conditions. The retry logic in the API route will handle any
 * duplicate key violations by calling this function again.
 * 
 * Strategy:
 * 1. Get the highest invoice number for today
 * 2. Increment by 1
 * 3. Add a small random offset to reduce collision probability
 * 4. Let the database constraint enforce uniqueness (retry handled by caller)
 * 
 * @returns Promise<string> - Invoice number (uniqueness enforced by DB + retry)
 * @throws Error if unable to generate invoice number
 */
export async function generateInvoiceNumber(): Promise<string> {
  try {
    // Get current date in YYYYMMDD format
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const dateStr = `${year}${month}${day}`
    
    // Query for the HIGHEST invoice number with today's date prefix
    const prefix = `INV-${dateStr}-`
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `${prefix}%`)
      .order('invoice_number', { ascending: false })
      .limit(1)
    
    if (error) {
      throw new Error(`Database query failed: ${error.message}`)
    }
    
    // Determine next sequence number
    let nextSequence = 1
    
    if (data && data.length > 0) {
      // Extract sequence number from the highest invoice number
      const lastInvoiceNumber = data[0].invoice_number
      const sequencePart = lastInvoiceNumber.slice(-4)
      const lastSequence = parseInt(sequencePart, 10)
      
      if (!isNaN(lastSequence)) {
        nextSequence = lastSequence + 1
      }
    }
    
    // Add a small random offset (0-2) to reduce collision probability
    // This helps when multiple requests happen simultaneously
    const randomOffset = Math.floor(Math.random() * 3)
    nextSequence += randomOffset
    
    // Check if we've exceeded the maximum sequence number for the day
    if (nextSequence > 9999) {
      throw new Error('Maximum invoice numbers reached for today (9999)')
    }
    
    // Format sequence number with leading zeros (4 digits)
    const sequenceStr = String(nextSequence).padStart(4, '0')
    
    // Combine to create the invoice number
    const invoiceNumber = `INV-${dateStr}-${sequenceStr}`
    
    return invoiceNumber
    
  } catch (error) {
    console.error('Error generating invoice number:', error)
    throw error
  }
}
