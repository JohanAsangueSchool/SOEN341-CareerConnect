# Sprint 3 Contribution Log
**Sara Loudagh 40342601**

### 1. Implementing Feature: Application Status Notifications (US-07)

Implemented a notification system that informs workers when the status of their job applications changes. Created a Supabase database trigger to automatically generate notifications when recruiters update application statuses. Built a notifications page where workers can view their notifications, mark individual notifications as read or unread, and mark all notifications as read. Also integrated a notification tab and unread count badge into the navigation bar.

**Time Spent:** [3 hours]

**Link:** https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/66

### 2. Implementing Feature: New Job Alert Service (US-11)

Implemented personalized job alerts that allow workers to select their preferred job categories. Created the database table and security policies for storing alert preferences, along with a Job Alerts page where workers can manage their selections. Added database triggers to automatically notify workers when recruiters publish new jobs matching their selected categories.

**Time Spent:** [2 hours]

**Link:** https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/66

### 3. Implementing Feature: Job Expiry Reminder Service (US-12)

Implemented application deadlines for job postings by integrating a deadline field into the recruiter job posting form and displaying deadlines on job detail pages. Created a Supabase function to notify workers when a saved job's application deadline is approaching. Configured a daily scheduled task using the Supabase pg_cron extension to execute the reminder function.

**Time Spent:** [2 hours]

**Link:** https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/66

### 4. Testing and Debugging

Manually tested application status notifications, job alerts, and job expiry reminders using Supabase and the application interface. Fixed lint errors and removed unused code while troubleshooting GitHub Actions CI and production build issues.

**Time Spent:** [1 hours]

**Link:** https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/66

### 5. AI Usage Documentation

Prepared the Sprint 3 AI usage log, documenting how AI was used for conceptual guidance during the development of the notification and reminder features.

**Time Spent:** [0.5 hours]

**Link:** [Sprint 3 AI Log](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/blob/main/AI_Log/Sara%20Loudagh/Sprint%203.md)