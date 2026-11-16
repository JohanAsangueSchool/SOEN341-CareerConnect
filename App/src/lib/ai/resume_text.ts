// Turns a resume's form fields into readable text for an AI prompt.

type Entry = Record<string, string | undefined>;

export type ResumeForPrompt = {
    title: string;
    summary: string | null;
    education: Entry[];
    experience: Entry[];
    skills: Entry[];
    projects: Entry[];
};

/** "Jan 2024", or "" for a missing or invalid date. */
function month(value: string | undefined) {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString('en-CA', { month: 'short', year: 'numeric', timeZone: 'UTC' })
        : '';
}

function period(entry: Entry) {
    const start = month(entry.startMonth);
    return start ? ` (${start} – ${month(entry.endMonth) || 'present'})` : '';
}

/** The resume as readable text for the prompt. */
export function resumeText(resume: ResumeForPrompt) {
    const sections = [`Resume title: ${resume.title}`];
    if (resume.summary) sections.push(`Summary:\n${resume.summary}`);

    const list = (heading: string, lines: string[]) => {
        if (lines.length > 0)
            sections.push(`${heading}:\n${lines.map((l) => `- ${l}`).join('\n')}`);
    };

    list(
        'Experience',
        resume.experience.map(
            (e) =>
                `${e.position} at ${e.establishment}${period(e)}${e.description ? `: ${e.description}` : ''}`,
        ),
    );
    list(
        'Education',
        resume.education.map(
            (e) =>
                `${e.program}, ${e.establishment}${period(e)}${e.description ? `: ${e.description}` : ''}`,
        ),
    );
    list(
        'Skills',
        resume.skills.map((s) => `${s.name}${s.description ? `: ${s.description}` : ''}`),
    );
    list(
        'Projects',
        resume.projects.map(
            (p) =>
                `${p.title}${p.link ? ` (${p.link})` : ''}${p.description ? `: ${p.description}` : ''}`,
        ),
    );

    return sections.join('\n\n');
}
