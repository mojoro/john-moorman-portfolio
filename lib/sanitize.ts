const MAX_INPUT_CHARS = 500

/**
 * Strip HTML tags and prompt-injection markers from user input.
 */
export function stripDangerous(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/\[INST\]|\[\/INST\]/gi, "")
    .replace(/<\|system\|>|<\|user\|>|<\|assistant\|>/gi, "")
    .trim()
}

/**
 * Sanitize user input before sending to Anthropic API.
 * Strips dangerous content and truncates to 500 chars.
 */
export function sanitizeInput(input: string): string {
  return stripDangerous(input).slice(0, MAX_INPUT_CHARS)
}
