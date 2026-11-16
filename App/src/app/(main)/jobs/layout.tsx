// The job pages are client components, so their route settings live here.
// The AI cover letter ([id]/actions.ts) and job recommendations (actions.ts)
// call Gemini and can take longer than the platform's default time limit for a
// Server Action.
export const maxDuration = 90;

export default function JobsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
