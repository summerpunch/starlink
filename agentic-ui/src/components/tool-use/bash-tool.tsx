'use client'

import { Terminal } from 'lucide-react'
import { ToolBadge } from './tool-badge'

export interface BashToolProps {
  label: string
}

export function BashTool({ label }: BashToolProps) {
  return <ToolBadge icon={Terminal} label={label} />
}
