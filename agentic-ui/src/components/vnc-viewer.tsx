'use client'

import {useEffect, useRef} from 'react'
import RFB from '@novnc/novnc/lib/rfb'

interface VNCViewerProps {
  url: string
  viewOnly?: boolean
}

export function VNCViewer(
  {url, viewOnly}: VNCViewerProps,
) {
  const displayRef = useRef(null)

  useEffect(() => {
    // 1.检查引用是否存在
    if (!displayRef.current) return

    // 2.创建代理连接
    const rfb = new RFB(displayRef.current, url, {
      credentials: {
        password: '',
        username: '',
        target: '',
      },
    })

    // 3.配置基础属性
    rfb.viewOnly = viewOnly || false
    rfb.scaleViewport = true
    rfb.background = '#000'
    rfb.addEventListener('connect', () => console.log('Connected'))
    rfb.addEventListener('disconnect', () => console.log('Disconnected'))

    return () => rfb.disconnect()
  }, [url, viewOnly])

  return (
    <div
      ref={displayRef}
      style={{width: '100%', height: '100vh', background: '#000'}}
    />
  )
}