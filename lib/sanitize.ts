const MAX_INPUT_CHARS = 500

/**
 * Sanitize user input before sending to Anthropic API.
 *
 * Layer 6 from CLAUDE.md cost-protection spec:
 * - Strip HTML tags to prevent stored XSS if echoed back
 * - Strip common prompt-injection markers ([INST], <|system|>, etc.)
 * - Truncate to MAX_INPUT_CHARS (500) to cap input tokens
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/\[INST\]|\[\/INST\]/gi, "")
    .replace(/<\|system\|>|<\|user\|>|<\|assistant\|>/gi, "")
    .trim()
    .slice(0, MAX_INPUT_CHARS)
}
