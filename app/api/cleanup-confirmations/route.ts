import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint for cleaning up expired session confirmations
 * This endpoint should be called by a scheduled job (cron) to maintain database performance
 * 
 * Security: Requires CLEANUP_API_KEY in Authorization header
 * Frequency: Recommended to run daily at low-traffic hours (e.g., 2 AM)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CLEANUP_API_KEY}`;
    
    if (!process.env.CLEANUP_API_KEY) {
      console.error('CLEANUP_API_KEY not configured');
      return NextResponse.json(
        { error: 'Cleanup service not configured' },
        { status: 503 }
      );
    }
    
    if (authHeader !== expectedAuth) {
      console.warn('Unauthorized cleanup attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Create Supabase client with service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return NextResponse.json(
        { error: 'Database configuration missing' },
        { status: 503 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Call the cleanup function
    const { data, error } = await supabase.rpc('cleanup_expired_session_confirmations');
    
    if (error) {
      console.error('Cleanup function error:', error);
      return NextResponse.json(
        { 
          error: 'Cleanup failed',
          details: error.message 
        },
        { status: 500 }
      );
    }
    
    const deletedCount = data || 0;
    const timestamp = new Date().toISOString();
    
    console.log(`Cleanup completed: ${deletedCount} records deleted at ${timestamp}`);
    
    return NextResponse.json({
      success: true,
      deletedCount,
      timestamp,
      message: `Successfully cleaned up ${deletedCount} expired session confirmation(s)`
    });
    
  } catch (error) {
    console.error('Unexpected error during cleanup:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for checking cleanup status (optional, for monitoring)
 * Returns count of records that would be cleaned up
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a trusted source
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CLEANUP_API_KEY}`;
    
    if (!process.env.CLEANUP_API_KEY) {
      return NextResponse.json(
        { error: 'Cleanup service not configured' },
        { status: 503 }
      );
    }
    
    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Database configuration missing' },
        { status: 503 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Count records that would be cleaned up
    const { count, error } = await supabase
      .from('session_confirmations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired')
      .lt('expires_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    if (error) {
      console.error('Error checking cleanup status:', error);
      return NextResponse.json(
        { error: 'Failed to check status' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      pendingCleanup: count || 0,
      message: `${count || 0} record(s) ready for cleanup`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Unexpected error checking cleanup status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
