'use client'

import { SquareChevronRight } from 'lucide-react'
import { ToolBadge } from './tool-badge'

export interface DefaultToolProps {
  label: string
}

export function DefaultTool({ label }: DefaultToolProps) {
  return <ToolBadge icon={SquareChevronRight} label={label} />
}
