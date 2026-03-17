'use client'

import { FileSearch } from 'lucide-react'
import { ToolBadge } from './tool-badge'

export interface FileToolProps {
  label: string
}

export function FileTool({ label }: FileToolProps) {
  return <ToolBadge icon={FileSearch} label={label} />
}
