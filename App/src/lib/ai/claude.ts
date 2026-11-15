import Anthropic from '@anthropic-ai/sdk';
import 'server-only';

// Shared Claude setup for the app's AI features (cover letters, resume
// feedback). Server-only: the API key must never reach the browser.

export const CLAUDE_MODEL = 'claude-opus-5-5';

let client: Anthropic | undefined;

/** The Claude client, or null when ANTHROPIC_API_KEY is not set. */
export function getClaude() {
    if (!process.env.ANTHROPIC_API_KEY) return null;
    client ??= new Anthropic();
    return client;
}

/** A message a user can act on, for an error thrown by a Claude request. */
export function describeClaudeError(error: unknown) {
    if (error instanceof Anthropic.AuthenticationError) {
        return 'The AI service is not set up correctly. Please tell the site administrator.';
    }
    if (error instanceof Anthropic.RateLimitError) {
        return 'The AI service is busy right now. Please try again in a minute.';
    }
    if (error instanceof Anthropic.APIConnectionError) {
        return 'Could not reach the AI service. Check your connection and try again.';
    }
    if (error instanceof Anthropic.APIError && (error.status ?? 0) >= 500) {
        return 'The AI service had a problem. Please try again.';
    }
    return 'Something went wrong while generating. Please try again.';
}
