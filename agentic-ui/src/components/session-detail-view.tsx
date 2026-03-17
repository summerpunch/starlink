'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionHeader } from '@/components/session-header'
import { ChatInput } from '@/components/chat-input'
import { PlanPanel } from '@/components/plan-panel'
import { ChatMessage } from '@/components/chat-message'
import { useSessionDetail } from '@/hooks/use-session-detail'
import {
  eventsToTimeline,
  getLatestPlanFromEvents,
} from '@/lib/session-events'
import type { FileInfo } from '@/lib/api/types'
import { sessionApi } from '@/lib/api/session'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export interface SessionDetailViewProps {
  sessionId: string
  initialMessage?: string
  initialAttachments?: string[]
  hasInitialMessage?: boolean
}

export function SessionDetailView({ sessionId, initialMessage, initialAttachments, hasInitialMessage }: SessionDetailViewProps) {
  const router = useRouter()
  const {
    session,
    files,
    events,
    loading,
    error,
    refresh,
    refreshFiles,
    sendMessage,
    streaming,
  } = useSessionDetail(sessionId, hasInitialMessage)

  const timeline = useMemo(() => eventsToTimeline(events), [events])
  const planSteps = useMemo(() => getLatestPlanFromEvents(events), [events])

  const [fileListOpen, setFileListOpen] = useState(false)
  const initialMessageSentRef = useRef(false)

  // 如果有初始消息，在会话加载完成后自动发送
  useEffect(() => {
    if (
      initialMessage &&
      !initialMessageSentRef.current &&
      session &&
      !loading &&
      !streaming
    ) {
      initialMessageSentRef.current = true
      
      // 发送初始消息
      sendMessage(initialMessage, initialAttachments || [])
        .then(() => {
          // 消息发送成功后，清理 URL 参数（延迟一下确保流已建立）
          setTimeout(() => {
            router.replace(`/sessions/${sessionId}`)
          }, 100)
        })
        .catch((e) => {
          toast.error(
            e instanceof Error ? e.message : '发送消息失败'
          )
        })
    }
  }, [initialMessage, initialAttachments, session, loading, streaming, sendMessage, sessionId, router])

  const handleSend = useCallback(
    async (message: string, uploadedFiles: FileInfo[]) => {
      try {
        const attachmentIds = uploadedFiles.map((f) => f.id)
        await sendMessage(message, attachmentIds)
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : '发送失败，请重试'
        )
        throw e
      }
    },
    [sendMessage]
  )

  const handleViewAllFiles = useCallback(() => {
    // 打开弹窗时刷新文件列表
    refreshFiles()
    setFileListOpen(true)
  }, [refreshFiles])

  const handleStop = useCallback(async () => {
    if (!session) return
    
    try {
      await sessionApi.stopSession(sessionId)
      toast.success('任务已停止')
      // 刷新会话状态
      refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '停止任务失败'
      )
    }
  }, [session, sessionId, refresh])

  if (loading && !session) {
    return (
      <div className="relative flex flex-col h-full flex-1 min-w-0 px-4 items-center justify-center">
        <p className="text-sm text-gray-500">加载中...</p>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="relative flex flex-col h-full flex-1 min-w-0 px-4 items-center justify-center gap-2">
        <p className="text-sm text-red-600">{error.message}</p>
        <button
          type="button"
          onClick={() => refresh()}
          className="text-sm text-primary underline"
        >
          重试
        </button>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="relative flex flex-col h-full flex-1 min-w-0 px-4 items-center justify-center">
        <p className="text-sm text-gray-500">未找到该任务</p>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full flex-1 min-w-0 px-4">
      <SessionHeader
        title={session.title}
        files={files}
        fileListOpen={fileListOpen}
        onFileListOpenChange={setFileListOpen}
        onFetchFiles={refreshFiles}
      />

      <div className="mx-auto w-full max-w-full sm:max-w-[768px] sm:min-w-[390px] flex flex-col flex-1">
        <div className="flex flex-col w-full gap-3 pb-[40px] pt-3 flex-1">
          {timeline.length === 0 && !streaming && (
            <div className="flex items-center justify-center py-8 text-sm text-gray-500">
              暂无对话记录，在下方输入任务或提问
            </div>
          )}
          {timeline.map((item) => (
            <ChatMessage
              key={item.id}
              item={item}
              onViewAllFiles={handleViewAllFiles}
            />
          ))}
          
          {/* 任务运行中的 loading 动画 */}
          {session?.status === 'running' && (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
              <Loader2 className="size-4 animate-spin" />
              <span>正在思考中...</span>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 mt-auto">
          <PlanPanel className="mb-2" steps={planSteps} />
          <ChatInput
            className="mb-4"
            onSend={handleSend}
            disabled={streaming}
            sessionId={sessionId}
            isRunning={session?.status === 'running'}
            onStop={handleStop}
          />
        </div>
      </div>
    </div>
  )
}
