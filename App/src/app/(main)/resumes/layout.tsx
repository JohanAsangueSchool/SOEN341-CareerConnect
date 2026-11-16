// The resumes pages are client components, so their route settings live here.
// AI resume feedback (actions.ts) calls Gemini and can take longer than the
// platform's default time limit for a Server Action.
export const maxDuration = 90;

export default function ResumesLayout({ children }: { children: React.ReactNode }) {
    return children;
}
