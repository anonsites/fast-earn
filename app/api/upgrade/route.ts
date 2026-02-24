import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Upgrade tier endpoint
  return NextResponse.json({ success: true })
}
