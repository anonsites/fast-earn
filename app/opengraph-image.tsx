import { ImageResponse } from 'next/og'

//export const runtime = 'edge'

export const alt = 'Fast Earn - Advertising Reward Platform'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  // Attempt to load logo.png from the same directory (app/)
  // You need to place a 'logo.png' file in your 'app' folder for this to work
  const logoData = await fetch(new URL('./logo.png', import.meta.url))
    .then((res) => {
      if (!res.ok) throw new Error('Failed to load logo')
      return res.arrayBuffer()
    })
    .catch(() => null)

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
          {logoData ? (
            // @ts-ignore
            <img src={logoData} width="120" height="120" style={{ borderRadius: 20 }} />
          ) : (
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 60,
                fontWeight: 'bold',
              }}
            >
              $
            </div>
          )}
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