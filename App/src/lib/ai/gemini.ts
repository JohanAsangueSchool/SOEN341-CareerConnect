import { ApiError, type GenerateContentResponse, GoogleGenAI } from '@google/genai';
import 'server-only';

// Shared Gemini setup for the app's AI features (cover letters, resume
// feedback). Uses the Gemini API's free tier. Server-only: the API key must
// never reach the browser.
//
// On the free tier Google may use what is sent to improve its products, so the
// dialogs say the text comes from Google Gemini.

export const GEMINI_MODEL = 'gemini-3.8-flash';

let client: GoogleGenAI | undefined;

/** The Gemini client, or null when GEMINI_API_KEY is not set. */
export function getGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    client ??= new GoogleGenAI({ apiKey });
    return client;
}

/**
 * Why a response has no usable answer, or null when it has one. Gemini blocks
 * some prompts or answers for safety and says so here instead of erroring.
 */
export function blockedReason(response: GenerateContentResponse) {
    if (response.promptFeedback?.blockReason) return 'blocked';
    const finish = response.candidates?.[0]?.finishReason;
    if (finish && finish !== 'STOP' && finish !== 'MAX_TOKENS') return 'blocked';
    if (!response.text?.trim()) return 'empty';
    return null;
}

/** A message a user can act on, for an error thrown by a Gemini request. */
export function describeGeminiError(error: unknown) {
    if (error instanceof ApiError) {
        if (error.status === 429) {
            return 'The free AI quota is used up for now. Please try again in a minute.';
        }
        if (
            error.status === 401 ||
            error.status === 403 ||
            (error.status === 400 && /api key/i.test(error.message))
        ) {
            return 'The AI service is not set up correctly. Please tell the site administrator.';
        }
        if (error.status >= 500) return 'The AI service had a problem. Please try again.';
    }
    return 'Something went wrong while generating. Please try again.';
}
