export const jobTypeColorPalette: Record<string, string> = {
    'Full-time': 'green',
    'Part-time': 'blue',
    Internship: 'purple',
    Contract: 'orange',
};

export function formatSalary(min: number | null, max: number | null) {
    if (min === null && max === null) return 'Salary not specified';

    // Values under 1000 are hourly rates, others are yearly salaries
    const unit = (max ?? min)! < 1000 ? '/hour' : '/year';
    const format = (value: number) => `$${value.toLocaleString('en-US')}`;

    if (min !== null && max !== null) return `${format(min)}–${format(max)}${unit}`;
    return `${format((min ?? max)!)}${unit}`;
}

export const jobStatusColorPalette: Record<string, string> = {
    Draft: 'gray',
    Open: 'green',
    Closed: 'red',
    Archived: 'orange',
};

/** A `YYYY-MM-DD` deadline as "Nov 20, 2026". Dates carry no time, so they are read as UTC. */
export function formatDeadline(deadline: string) {
    return new Date(`${deadline}T00:00:00Z`).toLocaleDateString('en-CA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

/** Today as `YYYY-MM-DD` in the viewer's time zone. */
export function today() {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** Whether the last day to apply is before today. The deadline day itself still accepts applications. */
export function isPastDeadline(deadline: string | null) {
    return !!deadline && deadline < today();
}
