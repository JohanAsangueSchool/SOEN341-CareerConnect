type Job = {
    id: number;
    title: string;
    company: string;
    location: string;
    jobType: string;
    salary: string;
    description: string;
    postedAt: string;
};

const jobs: Job[] = [
    {
        id: 1,
        title: 'Frontend Developer Intern',
        company: 'TechNova Solutions',
        location: 'Montreal, QC',
        jobType: 'Internship',
        salary: '$22–$28/hour',
        description:
            'Develop responsive web applications using React, TypeScript, and CSS. Collaborate with designers and backend developers to improve user experience.',
        postedAt: '2026-10-20',
    },
    {
        id: 2,
        title: 'Software Engineer',
        company: 'MapleTech Inc.',
        location: 'Toronto, ON',
        jobType: 'Full-time',
        salary: '$85,000–$110,000/year',
        description:
            'Design, develop, and maintain scalable software applications. Write clean code, participate in code reviews, and work with cross-functional teams.',
        postedAt: '2026-10-18',
    },
    {
        id: 3,
        title: 'UI/UX Designer',
        company: 'Creative Pixel Studio',
        location: 'Remote',
        jobType: 'Part-time',
        salary: '$40–$60/hour',
        description:
            'Create intuitive user interfaces and engaging user experiences. Develop wireframes, prototypes, and design systems using Figma.',
        postedAt: '2026-10-22',
    },
    {
        id: 4,
        title: 'Data Analyst',
        company: 'NorthStar Analytics',
        location: 'Vancouver, BC',
        jobType: 'Full-time',
        salary: '$70,000–$90,000/year',
        description:
            'Analyze business data, build dashboards, and generate actionable insights. Use SQL, Python, and data visualization tools to support decision-making.',
        postedAt: '2026-10-15',
    },
    {
        id: 5,
        title: 'Marketing Assistant',
        company: 'BrightPath Media',
        location: 'Ottawa, ON',
        jobType: 'Part-time',
        salary: '$20–$25/hour',
        description:
            'Assist with social media campaigns, create marketing content, track campaign performance, and support the marketing team with daily activities.',
        postedAt: '2026-10-24',
    },
];

export default function JobsPage() {
    return (
        <main className='min-h-screen bg-gray-50'>
            <div className='mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8'>

                <header className='mb-8'>
                    <p className='mb-2 text-sm font-semibold tracking-wider text-blue-600 uppercase'>
                        Career Opportunities
                    </p>

                    <h1 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
                        Job Listings
                    </h1>

                    <p className='mt-3 text-gray-600'>
                        Explore opportunities and find your next career move.
                    </p>
                </header>


                <div className='mb-5 flex items-center justify-between'>
                    <p className='text-sm text-gray-600'>
                        <span className='font-semibold text-gray-900'>{jobs.length}</span> available
                        positions
                    </p>
                </div>


                <div className='space-y-5'>
                    {jobs.map((job) => (
                        <article
                            key={job.id}
                            className='rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6'
                        >
                            <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                                <div className='min-w-0 flex-1'>
                                    <h2 className='text-xl font-semibold text-gray-900'>
                                        {job.title}
                                    </h2>

                                    <p className='mt-2 font-medium text-gray-700'>{job.company}</p>

                                    <div className='mt-3 flex flex-wrap gap-2'>
                                        <span className='rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700'>
                                            {job.location}
                                        </span>

                                        <span className='rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700'>
                                            {job.jobType}
                                        </span>
                                    </div>
                                </div>

                                <p className='shrink-0 text-sm text-gray-500'>{job.postedAt}</p>
                            </div>

                            <p className='mt-5 text-sm leading-6 text-gray-600'>
                                {job.description}
                            </p>

                            <div className='mt-5 border-t border-gray-100 pt-4'>
                                <p className='text-sm font-semibold text-gray-900'>{job.salary}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </main>
    );
}
