import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Fraud detection endpoint
  return NextResponse.json({ isFraud: false })
}
