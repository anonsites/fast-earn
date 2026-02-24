import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Fast Earn - Advertising Reward Platform'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(to bottom right, #0f172a, #1e293b)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 70,
              fontWeight: 'bold',
            }}
          >
            $
          </div>
          <div style={{ fontWeight: 'bold' }}>Fast Earn</div>
        </div>
        <div style={{ fontSize: 40, marginTop: 40, color: '#94a3b8' }}>
          Earn Money by Completing Tasks
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}