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
