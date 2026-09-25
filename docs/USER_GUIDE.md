# FresherPrep User Guide

This guide describes the user-facing product that is currently implemented. Screens and actions that are not available in the application are intentionally omitted.

## 1. Product overview

FresherPrep is a structured learning and interview-preparation application. Its main workflow is:

```text
Create an account
-> join a published learning path
-> open lessons in curriculum order
-> read at your own pace
-> complete a lesson assessment when one exists
-> review learning-path and quiz progress
```

The application currently supports Java-oriented technical content and English questions/quizzes when such content has been published by an administrator. System-interface language and learning-content language are separate settings.

## 2. Registering an account

Open `/register` and provide:

- Display name: the name shown in the application.
- Email address: used as the login identity and required to be unique.
- Password: must satisfy the validation shown by the form; the UI currently explains the 8-72 character range.

After successful registration, FresherPrep signs the new user in and opens the authenticated learning area. Passwords are sent only to the authentication endpoint and are stored by the backend as password hashes, not plaintext.

Common registration problems:

- An existing email cannot be registered again.
- Invalid or incomplete values produce field/request feedback and do not create a partial account.
- A network or backend failure keeps the form available for another attempt.

## 3. Login, session refresh, and logout

### Login

Open `/login`, enter the registered email and password, and select **Sign in**. If login was required while opening a protected page, the application returns to that page after authentication.

### Session behavior

The web frontend keeps access and refresh credentials in secure, HTTP-only cookies. JavaScript running in the browser cannot read those cookie values. When an access token expires, frontend API routes attempt one refresh and retry the backend request. A rejected or revoked refresh token ends the session and returns the user to login.

Closing or refreshing a page does not automatically log the user out. The refresh token has its own server-side expiry and can be revoked.

### Logout

Use **Sign out** in the application header or Profile page. Logout asks the backend to revoke the refresh token and clears both authentication cookies. It ends the current device session; it does not delete the account or learning history.

## 4. Application navigation

The authenticated application currently provides:

- **Dashboard** (`/dashboard`)
- **Learning paths** (`/learning-paths`)
- **Quizzes** (`/quizzes`)
- **Learning Games** (`/games`)
- **Progress** (`/progress`)
- **Profile** (`/profile`, reached from the account area)

Administrators additionally see an Admin entry. Authorization is still enforced by the backend; hiding or showing a link is not the security boundary.

## 5. Dashboard

The Dashboard summarizes existing backend data rather than creating a separate progress record. It can show:

- The latest joined learning path and required progress.
- A recommended lesson to continue.
- Recently joined paths.
- Recent lesson and quiz activity.
- Learning statistics derived from lesson progress and submitted quiz attempts.
- Achievements derived from available progress data.

Dashboard achievements are lightweight milestones, not XP, coins, a leaderboard, or a reward economy. If one data source fails, the corresponding section can show a retry state while other sections remain usable.

## 6. Knowledge and learning paths

Knowledge is organized by administrators as:

```text
Technology -> Category -> Topic -> Subtopic
```

There is currently no separate learner-facing knowledge-tree page. Learners encounter this structure through published learning paths, lesson organization, and quiz scopes.

### Browsing learning paths

Open `/learning-paths` to see published paths. The list is paginated and can show whether a path is available or already joined. Unpublished, review, draft, or archived paths are not learner content.

### Viewing a path

Open a path to see:

- Path name and technology.
- Ordered curriculum items.
- Required and optional lessons.
- Current backend-calculated progress when joined.
- The lesson that can be continued next.

### Joining a path

Select **Join** on a published path. Joining creates one membership for the authenticated user and path. Repeating the action does not create multiple memberships. A path that is no longer published cannot be newly joined.

Joining does not automatically complete or start every lesson. It enables the curriculum and progress view; individual lesson activity begins when lessons are opened.

### Path progress

Path progress is calculated by the backend from the path's required items and weights. Optional lessons do not replace required items. A path is complete only when the backend's required-item completion rule is satisfied.

## 7. Reading a lesson

Open a lesson from a learning path. The reading page prioritizes lesson content and can include headings, paragraphs, lists, callouts, inline code, and code blocks. It also provides breadcrumb context, prerequisites, previous/next navigation where context is available, and completion status.

Only published lessons can be opened by a learner. If a prerequisite is displayed, use its link to review that lesson. The backend remains authoritative for lesson availability.

### Starting lesson progress

Opening a published lesson starts or resumes the single progress record for the current user and lesson. Reloading does not create a duplicate record. Existing values such as active time, maximum scroll position, qualification, assessment state, and completion are restored from the backend.

### Active learning time

The lesson sidebar shows a count-up **Time spent** value.

Active time increases only while:

- the lesson page is open;
- the document is visible;
- the tab is active.

It pauses when the tab is hidden and resumes when the user returns. The frontend accumulates seconds locally and synchronizes them in batches instead of sending one request every second. It also attempts a final flush when visibility changes or the page is left. A failed synchronization shows retry feedback and retains pending time for a later attempt.

Most importantly:

> `activeSeconds` is informational learning activity. It is not a minimum reading requirement and never decides pass or fail.

A fast reader does not need to leave the page open merely to satisfy a timer.

### Reading qualification and scrolling

The backend records the maximum scroll percentage reached. For lessons without an assessment, reaching the configured scroll requirement is the current completion mechanism. For lessons with an assessment, scroll/reading status does not replace the assessment.

## 8. Lesson assessment and completion

A lesson may have one assessment quiz. When present, the assessment appears at the end of the lesson content.

The implemented flow is:

```text
Read/learn at your own pace
-> reach the assessment section
-> start or resume its attempt
-> answer one multiple-choice question at a time
-> submit once
-> backend grades the stored question-version snapshots
-> 80% or higher = lesson completed
-> below 80% = lesson remains incomplete
```

Assessment quizzes are normally configured around five questions, but their actual question count comes from administrator configuration. The UI never assumes that every assessment has exactly five questions.

### Answering an assessment

- Only one question is shown at a time.
- The progress indicator shows position and answered count.
- Choices are held in browser state and are not posted after every click.
- Session storage preserves in-progress choices during a reload on the same browser tab/session.
- The final submission sends selected option IDs once.
- The backend validates that each option belongs to its attempt question and calculates the score.

### Passing and retrying

Lesson assessments require an 80% pass percentage. The result displays correct/total, percentage, pass/fail, and explanations where available.

If the result is below 80%, the lesson remains incomplete and **Retry assessment** starts a new attempt after the failed one has been submitted. Reading time does not reset and the user is not required to wait before retrying.

If an assessment has already been passed, the backend continues deriving the lesson as completed after reload. A later content-page refresh does not erase the submitted attempt or completion.

## 9. Quizzes

### Quiz list and detail

Open `/quizzes` to browse published quizzes. The current filters distinguish language and category where supported. A quiz detail page shows title, selection mode, question count, pass threshold, maximum score, and time-limit information when configured.

Two selection modes exist:

- **FIXED**: administrators choose exact questions and their order.
- **RULE_BASED**: the backend selects published questions matching knowledge/difficulty rules when the attempt starts.

### Starting or resuming

Starting a quiz creates a `QuizAttempt` only when no in-progress attempt already exists for that user and quiz. Otherwise, FresherPrep resumes the latest active attempt.

At start time the backend snapshots:

- quiz title and pass threshold;
- language, category, maximum score, and optional duration;
- selected question IDs and exact question-version IDs;
- question order and subtopic context.

Dynamic rules are not rerun when a page reloads. Editing or publishing a newer question version cannot change an existing attempt.

### Answering questions

The attempt page presents one question at a time with navigation between questions. Current choices are kept in session storage for reload/resume. Correct answers and explanations are not exposed during an active attempt.

The frontend does not decide whether an answer is correct. Final option selections are sent to the backend, which validates ownership and relationships, records answer correctness, calculates score, and determines pass/fail.

### Countdown

If a quiz has `durationSeconds`, the attempt snapshots it and exposes an absolute expiry timestamp. The UI displays a countdown calculated from that timestamp, so reload does not reset the clock.

At `00:00`, answering is disabled and the page invokes the same final submit operation used by the manual submit button. A quiz without configured duration has no artificial timer.

### Submission and result

Before manual submission, a confirmation dialog shows answered and unanswered counts. Unanswered questions score zero. Submission is protected against rapid double-clicks; the backend also treats an already submitted attempt as immutable and returns its existing result.

The result page can show:

- score and percentage;
- pass/fail according to the attempt's snapshotted threshold;
- answered/total count;
- selected answer, correct answer, correctness, and explanation after submission;
- actions to retry, return to learning, or review activity where available.

### Quiz history

Recent in-progress and submitted attempts appear on Progress and Dashboard activity sections. Submitted attempts link to results; unfinished attempts link back to the attempt page. History is based on persisted attempts, not browser-only analytics.

## 10. Progress page

Open `/progress` for a focused learning overview:

- Joined/active paths and backend-calculated percentages.
- Completed required lesson counts.
- Recent completed and in-progress lessons.
- Recent quiz attempts, scores, and pass/fail status.

The page intentionally avoids fabricated streaks and decorative charts. Sections can fail independently and offer retry without hiding every other result. Counts shown from paginated recent data are summaries of the returned dataset unless explicitly labeled as totals by the backend.

## 11. Profile and settings

The Profile page displays the authenticated user's avatar initials, display name, email, role, and creation date when returned by the backend.

Users can currently:

- Update their display name.
- Choose Light, Dark, or System appearance.
- Choose Vietnamese or English interface language.
- Sign out.

Theme and language preferences are stored on the current device in `localStorage` and apply immediately. System theme follows the operating-system preference. These preferences do not translate lesson, question, option, or explanation content stored by the backend.

Password change, password recovery, email verification, OAuth, and social login are not exposed by the current product and are therefore not described as available actions.

## 12. English learning content

Administrators can publish English knowledge nodes and questions with English language/category metadata. Learners can browse published English quizzes through the same quiz list and use the same attempt, scoring, history, and result screens.

English is not a separate assessment architecture. Lesson assessments and general quizzes reuse the generic Quiz/QuizAttempt model. Switching the interface to English changes system labels only; it does not automatically translate backend learning content.

## 13. Troubleshooting

### A page returns to login

The access token and refresh token may both be expired or revoked. Sign in again. If logout occurred in another request, reloading a protected page also redirects to login.

### Progress did not update immediately

Lesson time is synchronized in batches. Keep the lesson open briefly or use **Retry sync** when shown. Assessment and quiz results already accepted by the backend are independent of a temporary time-sync failure.

### A lesson is unavailable

It may have been archived/unpublished, its parent knowledge node may not be published, or the ID may be invalid. Return to the published learning path.

### A quiz cannot start

The quiz may be unpublished or a RULE_BASED rule may not have enough eligible published questions. The application reports the backend business error instead of creating a partial attempt.

### Theme or language was reset

Preferences are device/browser-local. Clearing site storage restores Vietnamese and System-theme defaults.
