'use client'

import {VNCViewer} from '@/components/vnc-viewer'

export default function Page() {
  // docker run -d -p 8080:8080 -p 5900:5900 -p 5901:5901 -p 9222:9222 --name sandbox-dev sandbox-dev
  return (
    <div className="w-screen h-screen">
      <VNCViewer url="ws://127.0.0.1:5901" viewOnly={false}/>
    </div>
  )
}