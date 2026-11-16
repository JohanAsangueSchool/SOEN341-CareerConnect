import {
    ApiError,
    type GenerateContentParameters,
    type GenerateContentResponse,
    GoogleGenAI,
    ThinkingLevel,
} from '@google/genai';
import 'server-only';

// Shared Gemini setup for the app's AI features (cover letters, resume
// feedback). Uses the Gemini API's free tier. Server-only: the API key must
// never reach the browser.
//
// On the free tier Google may use what is sent to improve its products, so the
// dialogs say the text comes from Google Gemini.

/**
 * Free-tier models to try, best first. The free tier is often overloaded (503
 * "high demand") or rate-limited (429); when a model is busy or too slow, the
 * next one answers instead. gemini-3.8-flash is last: on the free tier it is
 * overloaded so often that trying it first cost every request its timeout.
 */
const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];

/**
 * How long each model gets before the next one is tried. Three tries stay
 * under the Server Actions' maxDuration (see the layouts next to them).
 */
const MODEL_TIMEOUT_MS = 25_000;

// Both features are short, well-defined writing tasks. Gemini thinks at its
// highest level by default, which made answers slow; LOW is enough here.
const THINKING = { thinkingLevel: ThinkingLevel.LOW };

let client: GoogleGenAI | undefined;

/** The Gemini client, or null when GEMINI_API_KEY is not set. */
export function getGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    client ??= new GoogleGenAI({ apiKey });
    return client;
}

/** Busy, rate-limited, failing or too slow: worth asking the next model. */
function isBusy(error: unknown) {
    if (error instanceof ApiError) return error.status === 429 || error.status >= 500;
    return (
        error instanceof Error && /abort|timeout|timed out/i.test(`${error.name} ${error.message}`)
    );
}

/**
 * Generates with the first free-tier model that answers in time. Each model
 * gets one try with a time limit (no silent retries). A busy model passes the
 * request on; any other error from the first model is thrown, since it means
 * the request itself is wrong.
 */
export async function generate(
    gemini: GoogleGenAI,
    request: Omit<GenerateContentParameters, 'model'>,
): Promise<GenerateContentResponse> {
    let lastError: unknown;

    for (const [index, model] of GEMINI_MODELS.entries()) {
        try {
            return await gemini.models.generateContent({
                ...request,
                model,
                config: {
                    thinkingConfig: THINKING,
                    ...request.config,
                    httpOptions: { timeout: MODEL_TIMEOUT_MS, retryOptions: { attempts: 1 } },
                },
            });
        } catch (error) {
            lastError = error;
            if (index === 0 && !isBusy(error)) throw error;
            console.warn(`Gemini ${model} did not answer, trying the next model:`, error);
        }
    }

    throw lastError;
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
    if (isBusy(error)) {
        return 'The free AI service is busy right now. Please try again in a minute.';
    }
    if (
        error instanceof ApiError &&
        (error.status === 401 ||
            error.status === 403 ||
            (error.status === 400 && /api key/i.test(error.message)))
    ) {
        return 'The AI service is not set up correctly. Please tell the site administrator.';
    }
    return 'Something went wrong while generating. Please try again.';
}
