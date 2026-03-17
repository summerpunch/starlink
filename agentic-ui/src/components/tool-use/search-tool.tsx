'use client'

import { Search } from 'lucide-react'
import { ToolBadge } from './tool-badge'

export interface SearchToolProps {
  label: string
}

export function SearchTool({ label }: SearchToolProps) {
  return <ToolBadge icon={Search} label={label} />
}
