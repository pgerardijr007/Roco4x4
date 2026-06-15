import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 50,
          background: '#1a1d2d',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          fontWeight: 900
        }}
      >
        <div style={{ marginBottom: -8 }}>ROCO</div>
        <div style={{ color: '#ff4d4d', fontSize: 45 }}>4X4</div>
      </div>
    ),
    {
      width: 192,
      height: 192,
    }
  )
}
