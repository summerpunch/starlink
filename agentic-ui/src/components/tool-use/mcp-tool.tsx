'use client'

import { Wrench } from 'lucide-react'
import { ToolBadge } from './tool-badge'

export interface McpToolProps {
  label: string
}

export function McpTool({ label }: McpToolProps) {
  return <ToolBadge icon={Wrench} label={label} />
}
