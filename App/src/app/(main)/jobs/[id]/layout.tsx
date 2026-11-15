// The job page is a client component, so its route settings live here.
// Generating a cover letter (actions.ts) calls Gemini and can take longer than
// the platform's default time limit for a Server Action.
export const maxDuration = 90;

export default function JobLayout({ children }: { children: React.ReactNode }) {
    return children;
}
