// The shape of the AI resume feedback: Gemini must answer in this schema, and
// the feedback dialog renders it.
import * as z from 'zod';

export const FEEDBACK_SECTIONS = [
    'Summary',
    'Experience',
    'Education',
    'Skills',
    'Projects',
    'Formatting',
    'Overall',
] as const;

export const FEEDBACK_PRIORITIES = ['High', 'Medium', 'Low'] as const;

export const FeedbackSchema = z.object({
    overall: z.string().describe('Two or three sentences on how strong the resume is overall.'),
    strengths: z.array(z.string()).describe('What the resume already does well.'),
    suggestions: z
        .array(
            z.object({
                section: z.enum(FEEDBACK_SECTIONS),
                priority: z.enum(FEEDBACK_PRIORITIES),
                issue: z
                    .string()
                    .describe('What is missing or weak, quoting the resume where useful.'),
                suggestion: z.string().describe('A concrete change the job seeker can make.'),
            }),
        )
        .describe('Improvements, most important first.'),
});

export type ResumeFeedback = z.infer<typeof FeedbackSchema>;
