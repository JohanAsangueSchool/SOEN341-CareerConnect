# CareerConnect

CarreerConnect is a web platform made to help users in their job search. With it, users can manage their resumes, submit and track applications.

## Problem

When searching for a job, people often apply at multiple places with multiple resumes making it difficult to stay organized accross the process.

## Solution

With CareerConnect, users will be able with only one account to access multiple job-offers, manage their resumes, submit applications and track their progress. Recruiters will also be able to post and manage job offers.

## Proposed Features

- **Real-Time Chat:** Real-Time chat to allow communication between users and recruiters.
- **Cover Letters Generator:** The platform AI will generate tailored cover letters for the user based on his resume and the job offer.

## Team Members

- Johan Asangue Tchoupa, @JohanAsangueSchool
- Jiaxin Li, @Jiaxin-Li-code
- Sara Loudagh, @saraludus
- David Peter, @davidpeter1123
- Xinlei Tian, @zaynezzz

## Branching Strategy

- The **main** branch is used for production.
- The **dev** branch is the one used for development, where each feature is tested before deployment on **main**.
- The **features/xxxx** branches are the one used to develop each feature independently before merging on **dev** for testing.
- Any changes made to the **dev** or **main** branch should be made using a pull request, reviewed by at least another team member.

## Technologies

- **NextJS:** NextJS is a full-stack web development framework for javascript/typescript based on react. It is the main framework used for the project, handling both frontend and backend functions.
- **PostgreSQL/Supabase:** PostgreSQL is a database management system. It is the main technology used in the project to manage and store data.
- **ChakraUI:** ChakraUI is an ui components library based on react.

## Setup Instructions

After cloning the repo, change into the code directory, career-connect:

```bash
cd App
```

Install the project dependencies:

```bash
npm install
```

Run the project using the following command:

```bash
npm run dev
```
