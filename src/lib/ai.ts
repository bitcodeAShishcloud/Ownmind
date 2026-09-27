/**
 * Optional AI enrichment.
 *
 * Everything here degrades gracefully. If no API key is configured, or the
 * request fails, each function returns null and the caller falls back to the
 * local heuristics in `enrich.ts`. The product must stay fully usable offline
 * of any model provider.
 *
 * Server only.
 */

export type AiConfig = {
  apiKey: string
  baseUrl: string
  model: string
}

function config(): AiConfig | null {
  const apiKey = process.env.OWNMIND_AI_API_KEY
  if (!apiKey) return null
  return {
    apiKey,
    baseUrl: process.env.OWNMIND_AI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OWNMIND_AI_MODEL || 'gpt-4o-mini',
  }
}

export function isAiConfigured() {
  return config() !== null
}

type ChatOptions = {
  system: string
  user: string
  /** Ask the model to answer with a JSON object matching this shape. */
  json?: boolean
  maxTokens?: number
  timeoutMs?: number
}

/**
 * Single chat completion against any OpenAI compatible endpoint. Returns the
 * raw text, or null on any failure so callers can fall back.
 */
export async function chat(options: ChatOptions): Promise<string | null> {
  const cfg = config()
  if (!cfg) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000)

  try {
    const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.2,
        max_tokens: options.maxTokens ?? 500,
        ...(options.json ? { response_format: { type: 'json_object' } } : {}),
        messages: [
          { role: 'system', content: options.system },
          { role: 'user', content: options.user },
        ],
      }),
    })

    if (!response.ok) return null

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    return payload.choices?.[0]?.message?.content ?? null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export async function chatJson<T>(options: ChatOptions): Promise<T | null> {
  const raw = await chat(options)
  if (!raw) return null
  try {
    // Some models wrap JSON in a fenced block even when asked for raw JSON.
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim()
    return JSON.parse(cleaned) as T
  } catch {
    return null
  }
}

export type ImageInsight = {
  title: string
  summary: string
  tags: string[]
  /** Dominant colour as a hex string, so cards can carry a colour swatch. */
  accent: string
  textInImage: string
}

/** Reads a remote image and describes it, including any text rendered on it. */
export async function describeImage(imageUrl: string): Promise<ImageInsight | null> {
  const cfg = config()
  if (!cfg) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: [
              'You label images for a personal bookmarking app.',
              'Reply with JSON using exactly these keys:',
              'title (string, max 8 words, describe what is shown, no brand names unless printed on the image),',
              'summary (string, max 25 words, what a person would want to recall about this later),',
              'tags (array of 4 to 7 lowercase single words, describing subject, medium, mood and use),',
              'accent (string, hex colour like #a3442c, the dominant colour that best represents the image),',
              'textInImage (string, every piece of legible text transcribed, empty string if there is none).',
            ].join(' '),
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Describe this image.' },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    })

    if (!response.ok) return null

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const raw = payload.choices?.[0]?.message?.content
    if (!raw) return null

    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim()
    return JSON.parse(cleaned) as ImageInsight
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
