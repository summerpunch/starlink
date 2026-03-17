'use client'

import { Globe } from 'lucide-react'
import { ToolBadge } from './tool-badge'

export interface BrowserToolProps {
  label: string
}

export function BrowserTool({ label }: BrowserToolProps) {
  return <ToolBadge icon={Globe} label={label} />
}
