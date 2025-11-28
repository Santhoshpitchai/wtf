import { supabase } from './supabase'

/**
 * Generates a unique invoice number in the format INV-YYYYMMDD-XXXX
 * where XXXX is a sequential 4-digit number for that day
 * 
 * Algorithm:
 * 1. Get current date in YYYYMMDD format
 * 2. Query database for highest invoice number with that date prefix
 * 3. Extract sequence number and increment by 1
 * 4. Pad to 4 digits with leading zeros
 * 5. Combine: INV-${dateStr}-${sequenceStr}
 * 
 * @returns Promise<string> - Unique invoice number
 * @throws Error if unable to generate invoice number after max retries
 */
export async function generateInvoiceNumber(): Promise<string> {
  const maxRetries = 3
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get current date in YYYYMMDD format
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const dateStr = `${year}${month}${day}`
      
      // Query for the highest invoice number with today's date prefix
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
      
      // Determine the next sequence number
      let nextSequence = 1
      
      if (data && data.length > 0) {
        const lastInvoiceNumber = data[0].invoice_number
        // Extract the sequence part (last 4 digits)
        const sequencePart = lastInvoiceNumber.slice(-4)
        const lastSequence = parseInt(sequencePart, 10)
        
        if (!isNaN(lastSequence)) {
          nextSequence = lastSequence + 1
        }
      }
      
      // Check if we've exceeded the maximum sequence number for the day
      if (nextSequence > 9999) {
        throw new Error('Maximum invoice numbers reached for today (9999)')
      }
      
      // Format sequence number with leading zeros (4 digits)
      const sequenceStr = String(nextSequence).padStart(4, '0')
      
      // Combine to create the invoice number
      const invoiceNumber = `INV-${dateStr}-${sequenceStr}`
      
      // Verify uniqueness by checking if this invoice number already exists
      const { data: existingInvoice, error: checkError } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('invoice_number', invoiceNumber)
        .single()
      
      // If no existing invoice found (error is expected), we have a unique number
      if (checkError && checkError.code === 'PGRST116') {
        // PGRST116 means no rows returned, which is what we want
        return invoiceNumber
      }
      
      // If we found an existing invoice, retry
      if (existingInvoice) {
        console.warn(`Invoice number ${invoiceNumber} already exists, retrying...`)
        continue
      }
      
      // If there was a different error, throw it
      if (checkError) {
        throw new Error(`Uniqueness check failed: ${checkError.message}`)
      }
      
      return invoiceNumber
      
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error
      }
      // Wait a bit before retrying to avoid race conditions
      await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)))
    }
  }
  
  throw new Error('Failed to generate unique invoice number after maximum retries')
}
