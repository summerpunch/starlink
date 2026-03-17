'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

export interface MarkdownContentProps {
  content: string
  className?: string
}

const headingClasses: Record<string, string> = {
  h1: 'text-lg font-semibold mt-4 mb-2 first:mt-0 text-gray-900',
  h2: 'text-base font-semibold mt-3 mb-1.5 first:mt-0 text-gray-900',
  h3: 'text-sm font-semibold mt-2.5 mb-1 first:mt-0 text-gray-800',
  h4: 'text-sm font-medium mt-2 mb-1 first:mt-0 text-gray-800',
  h5: 'text-sm font-medium mt-1.5 mb-0.5 first:mt-0 text-gray-700',
  h6: 'text-sm font-medium mt-1 mb-0.5 first:mt-0 text-gray-700',
}

const components: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({ node, className, ...props }) => (
    <h1 className={cn(headingClasses.h1, className)} {...props} />
  ),
  h2: ({ node, className, ...props }) => (
    <h2 className={cn(headingClasses.h2, className)} {...props} />
  ),
  h3: ({ node, className, ...props }) => (
    <h3 className={cn(headingClasses.h3, className)} {...props} />
  ),
  h4: ({ node, className, ...props }) => (
    <h4 className={cn(headingClasses.h4, className)} {...props} />
  ),
  h5: ({ node, className, ...props }) => (
    <h5 className={cn(headingClasses.h5, className)} {...props} />
  ),
  h6: ({ node, className, ...props }) => (
    <h6 className={cn(headingClasses.h6, className)} {...props} />
  ),
  p: ({ node, className, ...props }) => (
    <p className={cn('text-sm text-gray-700 leading-relaxed mb-2 last:mb-0', className)} {...props} />
  ),
  ul: ({ node, className, ...props }) => (
    <ul className={cn('text-sm text-gray-700 list-disc pl-5 mb-2 space-y-0.5', className)} {...props} />
  ),
  ol: ({ node, className, ...props }) => (
    <ol className={cn('text-sm text-gray-700 list-decimal pl-5 mb-2 space-y-0.5', className)} {...props} />
  ),
  li: ({ node, className, ...props }) => (
    <li className={cn('leading-relaxed', className)} {...props} />
  ),
  strong: ({ node, className, ...props }) => (
    <strong className={cn('font-semibold text-gray-900', className)} {...props} />
  ),
  code: ({ node, className, children, ...props }) => {
    const content = typeof children === 'string' ? children : ''
    const isBlock = content.includes('\n')
    return (
      <code
        className={cn(
          isBlock
            ? 'block p-3 rounded-md bg-gray-100 text-gray-800 text-sm font-mono overflow-x-auto my-2'
            : 'inline px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 text-[0.8125em] font-mono',
          className
        )}
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ node, className, ...props }) => (
    <pre className={cn('my-2 overflow-x-auto', className)} {...props} />
  ),
  blockquote: ({ node, className, ...props }) => (
    <blockquote
      className={cn(
        'border-l-4 border-gray-200 pl-3 py-0.5 my-2 text-sm text-gray-600 italic',
        className
      )}
      {...props}
    />
  ),
  a: ({ node, className, ...props }) => (
    <a
      className={cn('text-sm text-blue-600 hover:underline', className)}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn('markdown-content break-words', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
