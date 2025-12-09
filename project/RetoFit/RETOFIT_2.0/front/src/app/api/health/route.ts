import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'frontend',
    message: 'Service is running',
    timestamp: new Date().toISOString()
  });
}
