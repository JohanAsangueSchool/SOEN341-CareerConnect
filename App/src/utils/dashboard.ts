// Pure helpers for the recruiter dashboard, kept free of React and Supabase so they can be unit tested

export const DateRangeValues = ['all', '1d', '7d', '30d'] as const;

export type DateRange = (typeof DateRangeValues)[number];

export const dateRangeLabels: Record<DateRange, string> = {
    all: 'Any time',
    '1d': 'Past 24 hours',
    '7d': 'Past 7 days',
    '30d': 'Past 30 days',
};

const dateRangeDays: Record<DateRange, number | null> = {
    all: null,
    '1d': 1,
    '7d': 7,
    '30d': 30,
};

const DAY_MS = 24 * 60 * 60 * 1000;

type DatedApplication = {
    status: string;
    applied_at: string;
};

export type ApplicationFilters = {
    status?: string;
    dateRange?: DateRange;
    sort?: 'newest' | 'oldest';
};

// Filters by status and submission date, then sorts by submission date
export function filterApplications<T extends DatedApplication>(
    applications: T[],
    { status = '', dateRange = 'all', sort = 'newest' }: ApplicationFilters,
    now: Date = new Date(),
) {
    const days = dateRangeDays[dateRange];
    const since = days === null ? null : now.getTime() - days * DAY_MS;

    return applications
        .filter((application) => !status || application.status === status)
        .filter((application) => since === null || Date.parse(application.applied_at) >= since)
        .sort((a, b) => {
            const difference = Date.parse(a.applied_at) - Date.parse(b.applied_at);
            return sort === 'oldest' ? difference : -difference;
        });
}

// Groups applications by the posting they were submitted to
export function groupByJob<T extends { job_id: string }>(applications: T[]) {
    const groups = new Map<string, T[]>();

    applications.forEach((application) => {
        groups.set(application.job_id, [...(groups.get(application.job_id) ?? []), application]);
    });

    return groups;
}

// Number of applications in each status, leaving out statuses with none
export function countByStatus(applications: { status: string }[]) {
    const counts: Record<string, number> = {};

    applications.forEach(({ status }) => {
        counts[status] = (counts[status] ?? 0) + 1;
    });

    return counts;
}

export const PostingViewValues = ['active', 'archived', 'all'] as const;

export type PostingView = (typeof PostingViewValues)[number];

export const postingViewLabels: Record<PostingView, string> = {
    active: 'Active postings',
    archived: 'Archived postings',
    all: 'All postings',
};

// Archived postings are kept out of the way unless the recruiter asks for them
export function filterPostings<T extends { status: string }>(jobs: T[], view: PostingView) {
    if (view === 'all') return jobs;

    return jobs.filter((job) => (job.status === 'Archived') === (view === 'archived'));
}
