// The shape of the AI job recommendations: Gemini must answer in this schema,
// and the Jobs page renders it.
import * as z from 'zod';

export const MATCH_LEVELS = ['Strong', 'Good'] as const;

/** How many recommendations Gemini may return. */
export const MAX_RECOMMENDATIONS = 5;

export const MatchSchema = z.object({
    recommendations: z
        .array(
            z.object({
                ref: z.string().describe('The reference of the posting, such as "J3".'),
                match: z.enum(MATCH_LEVELS),
                reason: z
                    .string()
                    .describe(
                        'One or two sentences, addressed to the job seeker, naming what in their resume or profile fits this posting.',
                    ),
            }),
        )
        .describe(
            `At most ${MAX_RECOMMENDATIONS} of the best-fitting postings, best first. Empty when none fits.`,
        ),
});

export type JobMatch = z.infer<typeof MatchSchema>['recommendations'][number];
