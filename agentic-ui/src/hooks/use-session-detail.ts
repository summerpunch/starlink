'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { sessionApi } from '@/lib/api/session'
import { normalizeEvent, normalizeEvents } from '@/lib/session-events'
import type { SessionDetail, SSEEventData, SessionFile } from '@/lib/api/types'

export type UseSessionDetailResult = {
  session: SessionDetail | null
  files: SessionFile[]
  events: SSEEventData[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  refreshFiles: () => Promise<void>
  sendMessage: (message: string, attachmentIds: string[]) => Promise<void>
  streaming: boolean
}

/**
 * 任务详情：拉取会话详情与文件列表，管理事件列表；
 * 未完成任务会通过 chat 空 body 流式拉取事件，发送消息时通过 chat 带 body 流式追加事件。
 */
export function useSessionDetail(
  sessionId: string | null,
  initialSkipEmptyStream?: boolean
): UseSessionDetailResult {
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [files, setFiles] = useState<SessionFile[]>([])
  const [events, setEvents] = useState<SSEEventData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [skipEmptyStream, setSkipEmptyStream] = useState(initialSkipEmptyStream || false)
  const emptyStreamCleanupRef = useRef<(() => void) | null>(null)
  const messageStreamCleanupRef = useRef<(() => void) | null>(null)
  const isSendMessageRef = useRef(false)

  const appendEvent = useCallback((ev: SSEEventData) => {
    let evToAppend = ev
    if (ev.data && typeof ev.data === 'object' && ('event' in ev.data || 'type' in ev.data) && 'data' in ev.data) {
      const normalized = normalizeEvent(ev.data as { event?: string; type?: string; data?: unknown })
      if (normalized) evToAppend = normalized
    }
    setEvents((prev) => [...prev, evToAppend])
    
    // 更新会话标题
    if (evToAppend.type === 'title' && evToAppend.data && typeof (evToAppend.data as { title?: string }).title === 'string') {
      setSession((prev) =>
        prev ? { ...prev, title: (evToAppend.data as { title: string }).title } : null
      )
    }
    
    // 监听事件更新会话状态
    // step:running 时更新为 running
    if (evToAppend.type === 'step') {
      const stepData = evToAppend.data as { status?: string }
      if (stepData.status === 'running') {
        setSession((prev) => prev ? { ...prev, status: 'running' } : null)
      }
    }
    
    // done 事件时更新为 completed
    if (evToAppend.type === 'done') {
      setSession((prev) => prev ? { ...prev, status: 'completed' } : null)
    }
    
    // error 事件时也可以认为任务结束
    if (evToAppend.type === 'error') {
      setSession((prev) => prev ? { ...prev, status: 'completed' } : null)
    }
  }, [])

  const startEmptyStream = useCallback(() => {
    if (!sessionId) return
    if (emptyStreamCleanupRef.current) {
      emptyStreamCleanupRef.current()
      emptyStreamCleanupRef.current = null
    }
    emptyStreamCleanupRef.current = sessionApi.chat(
      sessionId,
      {},
      (ev) => appendEvent(ev),
      (err) => {
        // 忽略 AbortError，这是正常的连接中止（页面跳转、组件卸载等）
        if (err.name === 'AbortError') {
          return
        }
        console.warn('Session detail empty stream error:', err)
      }
    )
  }, [sessionId, appendEvent])

  const stopEmptyStream = useCallback(() => {
    if (emptyStreamCleanupRef.current) {
      emptyStreamCleanupRef.current()
      emptyStreamCleanupRef.current = null
    }
  }, [])

  const normalizeFileList = useCallback((raw: unknown): SessionFile[] => {
    if (Array.isArray(raw)) return raw as SessionFile[]
    if (raw && typeof raw === 'object' && 'files' in raw && Array.isArray((raw as { files: unknown }).files)) {
      return (raw as { files: SessionFile[] }).files
    }
    if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as { data: unknown }).data)) {
      return (raw as { data: SessionFile[] }).data
    }
    return []
  }, [])

  const refresh = useCallback(async () => {
    if (!sessionId) return
    setError(null)
    try {
      const [detail, fileListRaw] = await Promise.all([
        sessionApi.getSessionDetail(sessionId),
        sessionApi.getSessionFiles(sessionId),
      ])
      setSession(detail)
      setFiles(normalizeFileList(fileListRaw))
      const rawEvents = (detail as { events?: unknown }).events
      if (rawEvents && Array.isArray(rawEvents) && rawEvents.length > 0) {
        setEvents(normalizeEvents(rawEvents))
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error('加载失败'))
    } finally {
      setLoading(false)
    }
  }, [sessionId, normalizeFileList])

  const refreshFiles = useCallback(async () => {
    if (!sessionId) return
    try {
      const fileListRaw = await sessionApi.getSessionFiles(sessionId)
      setFiles(normalizeFileList(fileListRaw))
    } catch (e) {
      console.error('刷新文件列表失败:', e)
    }
  }, [sessionId, normalizeFileList])

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      setSession(null)
      setFiles([])
      setEvents([])
      setError(null)
      stopEmptyStream()
      return
    }
    setLoading(true)
    refresh().then(() => {
      // 由下面的 effect 根据 session 状态决定是否开空流
    })
    return () => {
      stopEmptyStream()
    }
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sessionId || !session) return
    const status = session.status
    const completed = status === 'completed'
    // 如果标记了跳过空流（比如有初始消息待发送），则不启动空流
    if (!completed && !isSendMessageRef.current && !skipEmptyStream) {
      startEmptyStream()
    }
    return () => {
      stopEmptyStream()
    }
  }, [sessionId, session?.status, skipEmptyStream, startEmptyStream, stopEmptyStream])

  // 组件卸载时清理消息流
  useEffect(() => {
    return () => {
      if (messageStreamCleanupRef.current) {
        messageStreamCleanupRef.current()
        messageStreamCleanupRef.current = null
      }
    }
  }, [])

  const sendMessage = useCallback(
    async (message: string, attachmentIds: string[]) => {
      if (!sessionId) return
      stopEmptyStream()
      // 发送消息时，清除跳过空流的标记
      setSkipEmptyStream(false)
      isSendMessageRef.current = true
      setStreaming(true)
      
      // 立即更新状态为 running，不等待 SSE 事件
      setSession((prev) => prev ? { ...prev, status: 'running' } : null)
      
      const onEvent = (ev: SSEEventData) => {
        appendEvent(ev)
        if (ev.type === 'done') {
          setStreaming(false)
          isSendMessageRef.current = false
          // 清理消息流的 cleanup
          if (messageStreamCleanupRef.current) {
            messageStreamCleanupRef.current()
            messageStreamCleanupRef.current = null
          }
          setSession((prev) => prev ? { ...prev } : null)
          startEmptyStream()
        }
      }
      const messageStreamCleanup = sessionApi.chat(
        sessionId,
        { message, attachments: attachmentIds },
        onEvent,
        (err) => {
          // 忽略 AbortError，这是正常的连接中止
          if (err.name === 'AbortError') {
            setStreaming(false)
            isSendMessageRef.current = false
            return
          }
          setError(err instanceof Error ? err : new Error('流式响应异常'))
          setStreaming(false)
          isSendMessageRef.current = false
          // 出错时恢复状态为 completed
          setSession((prev) => prev ? { ...prev, status: 'completed' } : null)
          // 清理消息流的 cleanup
          if (messageStreamCleanupRef.current) {
            messageStreamCleanupRef.current()
            messageStreamCleanupRef.current = null
          }
          startEmptyStream()
        }
      )
      // 将消息流的 cleanup 存到独立的 ref，不与 emptyStream 混淆
      messageStreamCleanupRef.current = messageStreamCleanup
    },
    [sessionId, appendEvent, startEmptyStream, stopEmptyStream]
  )

  return {
    session,
    files,
    events,
    loading,
    error,
    refresh,
    refreshFiles,
    sendMessage,
    streaming,
  }
}
