import type { ChatAskResult, ChatExchange } from '~/types/course'

/**
 * Drives the AI chat panel: posts questions to POST /api/chat/ask and keeps
 * a running list of question/answer exchanges (with source references).
 */
export function useChatAsk() {
  const config = useRuntimeConfig()
  const exchanges = useState<ChatExchange[]>('chat-exchanges', () => [])

  async function ask(question: string) {
    const trimmed = question.trim()
    if (!trimmed) return

    const exchange: ChatExchange = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      question: trimmed,
      answer: '',
      references: [],
      pending: true,
      error: null
    }
    exchanges.value = [...exchanges.value, exchange]

    try {
      const result = await $fetch<ChatAskResult>('/api/chat/ask', {
        method: 'POST',
        baseURL: config.public.apiBase,
        body: { question: trimmed }
      })
      exchange.answer = result.answer
      exchange.references = result.references
    } catch (err: any) {
      exchange.error = err?.data?.error || err?.message || 'Failed to reach the AI tutor.'
    } finally {
      exchange.pending = false
    }
  }

  function clear() {
    exchanges.value = []
  }

  return { exchanges, ask, clear }
}
