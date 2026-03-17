'use client'

import { Bot } from 'lucide-react'
import { ToolBadge } from './tool-badge'

export interface A2aToolProps {
  label: string
}

export function A2aTool({ label }: A2aToolProps) {
  return <ToolBadge icon={Bot} label={label} />
}
