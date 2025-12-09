import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'landing-page',
    message: 'Service is running',
    timestamp: new Date().toISOString()
  });
}
