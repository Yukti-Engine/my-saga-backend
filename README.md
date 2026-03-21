# My Saga — Backend API

My Saga is an adventure-organizing platform where users with shared hobbies within a certain match radius (and other criteria) are grouped together for a 30-day adventure. During the adventure, a guide (**Organizer**) hosts regular events, and a **Boss** evaluates participants in a final exam — all to help people learn, grow, and have fun together.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express 5
- **Database:** PostgreSQL (via `pg`)
- **Real-time:** Socket.IO (adventure chat rooms)
- **Storage:** Google Cloud Storage (file uploads per adventure)
- **OTP:** MSG91
- **Bot Protection:** Google reCAPTCHA v3

## Getting Started

```bash
# Install dependencies
npm install

# Copy and fill in your environment variables
cp .env.example .env

# Seed the database, run migrations, and start the server
npm run dev
```

### Environment Variables

| Variable                        | Description                        |
| ------------------------------- | ---------------------------------- |
| `PORT`                          | Server port (default `8080`)       |
| `DATABASE_URL`                  | PostgreSQL connection string       |
| `MY_EMAIL`                      | Nodemailer sender email            |
| `MY_EMAIL_PASS`                 | Nodemailer email app password      |
| `MSG91_AUTH_KEY`                 | MSG91 auth key for OTP             |
| `GOOGLE_APPLICATION_CREDENTIALS`| Path to GCS service account JSON   |
| `RECAPTCHA_API_KEY`             | Google reCAPTCHA v3 secret key     |
| `SUPER_TOKEN`                   | Moderator super token              |

## Roles

| Role          | Description                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| **User**      | A participant who joins adventures, earns gems, collects badges, and gains star scores and levels.     |
| **Organizer** | A guide who creates match lobbies, starts adventures, organizes events, and marks attendance.          |
| **Boss**      | An evaluator (can be a celebrity or expert) who joins the adventure to conduct an exam, award star scores and badges. |

## Core Concepts

### Adventures
A 30-day group experience. An organizer creates a lobby with criteria (category, location, team size, age range, pay). Users and a boss browse available lobbies and join. Once enough members and a boss have joined, the organizer starts the adventure.

### Events & Exams
Throughout the adventure, the organizer schedules **events** (group activities at a venue and time). The boss can schedule one **exam** — a special evaluative event where participants receive star scores, remarks, and badges.

### Matchmaking
1. **Organizer** creates a match request (lobby) specifying category, match radius, team size, age range, cost, and location.
2. **Users & Bosses** browse compatible lobbies using the search endpoint. Compatibility is checked both ways — the searcher's criteria must match the lobby's, and vice versa.
3. When a user or boss joins, the system runs a `match_request` to pair them into the lobby.
4. Once the minimum team size is met and a boss is present, the organizer can **start the adventure**.

### Gems
An in-app currency. Users spend gems to join adventures and to send notifications to other users.

### Star Scores, Levels & Penalties
- **Star scores** are awarded by the boss after the exam.
- **Levels** represent overall user progression.
- **Penalties** are deducted for bad behavior or absences.

### Badges & Qualifications
Badges are earned through strong performance in an exam. Users, bosses, and organizers can view their collected badges (qualifications) on their profile.

### Gender Preferences
Female users can set two team-composition preferences:
- **setting_1** — require an all-female team.
- **setting_2** — require at least half the team to be female.

These preferences are factored into matchmaking.

---

## API Reference

> All routes use **POST** with **JSON bodies** (`Content-Type: application/json`).
> Authentication is done via `accessToken` passed in the **request body** (not headers).
> Fields marked with `?` are optional.

---

### Auth (`/auth`)

#### `POST /auth/signup-request-otp`

Start the signup flow. Sends an OTP to the user's phone. Protected by reCAPTCHA.

**Request body:**
```json
{
  "name": "string",
  "phone": "string",
  "email?": "string",
  "dob": "string (YYYY-MM-DD)",
  "gender": "string (M/F)",
  "recaptchaToken": "string"
}
```

**Response:**
```json
{ "message": "OTP sent", "requestId": "string" }
```

---

#### `POST /auth/signup-verify-otp`

Verify the OTP and create the user account.

**Request body:**
```json
{
  "requestId": "string",
  "otp": "string"
}
```

**Response:**
```json
{ "message": "Signup successful" }
```

---

#### `POST /auth/signup-resend-otp`

Resend the signup OTP.

**Request body:**
```json
{
  "requestId": "string"
}
```

**Response:**
```json
{ "message": "OTP sent" }
```

---

#### `POST /auth/login-request-otp`

Start user login. Sends OTP to the user's registered phone.

**Request body:**
```json
{
  "phone": "string"
}
```

**Response:**
```json
{ "message": "OTP sent", "phone": "string" }
```

---

#### `POST /auth/login-verify-otp`

Verify login OTP and receive an access token.

**Request body:**
```json
{
  "phone": "string",
  "otp": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "accessToken": "string",
  "uid": "number"
}
```

---

#### `POST /auth/login-resend-otp`

Resend the login OTP.

**Request body:**
```json
{
  "phone": "string"
}
```

**Response:**
```json
{ "message": "OTP sent", "phone": "string" }
```

---

#### `POST /auth/organizer-login`

Organizer login with email and password.

**Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "accessToken": "string",
  "oid": "number"
}
```

---

#### `POST /auth/boss-login`

Boss login with email and password.

**Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "accessToken": "string",
  "bid": "number"
}
```

---

### User (`/user`)

> All routes require `uid` and `accessToken` in the body (authenticated via `authUser` middleware).

#### `POST /user/dashboard`

Get the authenticated user's profile and stats.

**Request body:**
```json
{
  "uid": "number",
  "accessToken": "string"
}
```

**Response:**
```json
{
  "id": "number",
  "username": "string",
  "email": "string",
  "level": "number",
  "star_score": "number",
  "penalties": "number",
  "gems": "number",
  "bio": "string",
  "age": "number",
  "gender": "string",
  "setting_1": "boolean",
  "setting_2": "boolean",
  "icon": "string (base64) | null"
}
```

---

#### `POST /user/update-profile`

Update the user's profile fields. Only include the fields you want to change inside `updates`.

**Request body:**
```json
{
  "uid": "number",
  "accessToken": "string",
  "updates": {
    "username?": "string",
    "bio?": "string",
    "email?": "string",
    "setting1?": "boolean",
    "setting2?": "boolean",
    "icon?": "string (base64)"
  }
}
```

---

#### `POST /user/current-adventures`

Get the user's active adventures.

**Request body:**
```json
{
  "uid": "number",
  "accessToken": "string"
}
```

---

#### `POST /user/past-adventures`

Get the user's past (inactive) adventures, paginated.

**Request body:**
```json
{
  "uid": "number",
  "accessToken": "string",
  "a": "number (offset)",
  "b": "number (limit)"
}
```

---

#### `POST /user/match`

Join a match lobby. Costs gems if successful.

**Request body:**
```json
{
  "uid": "number",
  "accessToken": "string",
  "minTeamMembers": "number",
  "ageRangeMin": "number",
  "ageRangeMax": "number",
  "matchRequest": {
    "id": "number",
    "boss_id": "number",
    "org_id": "number",
    "category_id": "number",
    "match_radius": "number",
    "min_team_members": "number",
    "age_range_min": "number",
    "age_range_max": "number",
    "latitude": "number",
    "longitude": "number",
    "pay_per_head": "number",
    "pay_per_head_2": "number",
    "all_girls": "boolean",
    "half_girls": "boolean"
  }
}
```

**Response:**
```json
{ "success": true }
// or
{ "success": false, "message": "Insufficient gems" }
```

---

#### `POST /user/lobby`

Get the user's current match request (if waiting in a lobby).

**Request body:**
```json
{
  "uid": "number",
  "accessToken": "string"
}
```

---

#### `POST /user/qualifications`

Get the user's earned badges.

**Request body:**
```json
{
  "uid": "number",
  "accessToken": "string"
}
```

**Response:** Array of `{ badge_id }` objects.

---

#### `POST /user/logout`

Log the user out and clear the access token.

**Request body:**
```json
{
  "uid": "number",
  "accessToken": "string"
}
```

---

### Organizer (`/organizer`)

> All routes require `oid` and `accessToken` in the body (authenticated via `authOrganizer` middleware).

#### `POST /organizer/dashboard`

Get the organizer's profile.

**Request body:**
```json
{
  "oid": "number",
  "accessToken": "string"
}
```

**Response:**
```json
{
  "username": "string",
  "bio": "string",
  "gender": "string",
  "credits": "number",
  "age": "number",
  "setting_1": "boolean",
  "setting_2": "boolean",
  "icon": "string (base64) | null"
}
```

---

#### `POST /organizer/update-profile`

Update the organizer's profile.

**Request body:**
```json
{
  "oid": "number",
  "accessToken": "string",
  "updates": {
    "username?": "string",
    "bio?": "string",
    "setting1?": "boolean",
    "setting2?": "boolean",
    "icon?": "string (base64)"
  }
}
```

---

#### `POST /organizer/create-lobby`

Create a new match request (lobby) with search/match criteria.

**Request body:**
```json
{
  "oid": "number",
  "accessToken": "string",
  "categoryId": "number",
  "matchRadius": "number",
  "minTeamMembers": "number",
  "ageRangeMin": "number",
  "ageRangeMax": "number",
  "latitude": "number",
  "longitude": "number",
  "payPerHead": "number"
}
```

> `all_girls` and `half_girls` are auto-derived from the organizer's gender and settings.

---

#### `POST /organizer/start-adventure`

Start an adventure from the current lobby. Requires a boss and minimum team members.

**Request body:**
```json
{
  "oid": "number",
  "accessToken": "string",
  "name": "string (adventure name)"
}
```

**Response:**
```json
{ "success": true }
// or
{ "success": false }
```

---

#### `POST /organizer/current-adventures`

Get the organizer's active adventures.

**Request body:**
```json
{
  "oid": "number",
  "accessToken": "string"
}
```

---

#### `POST /organizer/past-adventures`

Get the organizer's past adventures, paginated.

**Request body:**
```json
{
  "oid": "number",
  "accessToken": "string",
  "a": "number (offset)",
  "b": "number (limit)"
}
```

---

#### `POST /organizer/organize-event`

Schedule an event for an adventure. Only the related organizer can do this.

**Request body:**
```json
{
  "oid": "number",
  "accessToken": "string",
  "activity": "string",
  "timing": "string (ISO 8601 timestamp)",
  "venue": "string",
  "venueLink": "string",
  "adventureId": "number",
  "instruction": "string"
}
```

**Response:**
```json
{ "success": true, "eventId": "number" }
```

---

#### `POST /organizer/lobby`

Get the organizer's current match request.

**Request body:**
```json
{
  "oid": "number",
  "accessToken": "string"
}
```

---

#### `POST /organizer/logout`

Log the organizer out.

**Request body:**
```json
{
  "oid": "number",
  "accessToken": "string"
}
```

---

### Boss (`/boss`)

> All routes require `bid` and `accessToken` in the body (authenticated via `authBoss` middleware).

#### `POST /boss/dashboard`

Get the boss's profile.

**Request body:**
```json
{
  "bid": "number",
  "accessToken": "string"
}
```

**Response:**
```json
{
  "username": "string",
  "gender": "string",
  "bio": "string",
  "age": "number",
  "setting_1": "boolean",
  "setting_2": "boolean",
  "icon": "string (base64) | null"
}
```

---

#### `POST /boss/update-profile`

Update the boss's profile.

**Request body:**
```json
{
  "bid": "number",
  "accessToken": "string",
  "updates": {
    "username?": "string",
    "bio?": "string",
    "setting1?": "boolean",
    "setting2?": "boolean",
    "icon?": "string (base64)"
  }
}
```

---

#### `POST /boss/current-adventures`

Get the boss's active adventures.

**Request body:**
```json
{
  "bid": "number",
  "accessToken": "string"
}
```

---

#### `POST /boss/past-adventures`

Get the boss's past adventures, paginated.

**Request body:**
```json
{
  "bid": "number",
  "accessToken": "string",
  "a": "number (offset)",
  "b": "number (limit)"
}
```

---

#### `POST /boss/match`

Join a match lobby as a boss.

**Request body:**
```json
{
  "bid": "number",
  "accessToken": "string",
  "minTeamMembers": "number",
  "ageRangeMin": "number",
  "ageRangeMax": "number",
  "payPerHead2": "number",
  "matchRequest": {
    "id": "number",
    "boss_id": "number",
    "org_id": "number",
    "category_id": "number",
    "match_radius": "number",
    "min_team_members": "number",
    "age_range_min": "number",
    "age_range_max": "number",
    "latitude": "number",
    "longitude": "number",
    "pay_per_head": "number",
    "pay_per_head_2": "number",
    "all_girls": "boolean",
    "half_girls": "boolean"
  }
}
```

---

#### `POST /boss/organize-exam`

Schedule an exam event for an adventure. Only the related boss can do this.

**Request body:**
```json
{
  "bid": "number",
  "accessToken": "string",
  "activity": "string",
  "timing": "string (ISO 8601 timestamp)",
  "venue": "string",
  "venueLink": "string",
  "adventureId": "number",
  "instruction": "string"
}
```

**Response:**
```json
{ "success": true, "eventId": "number" }
```

---

#### `POST /boss/lobby`

Get the boss's current match request.

**Request body:**
```json
{
  "bid": "number",
  "accessToken": "string"
}
```

---

#### `POST /boss/qualifications`

Get the boss's earned badges.

**Request body:**
```json
{
  "bid": "number",
  "accessToken": "string"
}
```

**Response:** Array of `{ badge_id }` objects.

---

#### `POST /boss/logout`

Log the boss out.

**Request body:**
```json
{
  "bid": "number",
  "accessToken": "string"
}
```

---

### Adventure (`/adventure`)

> Most routes require `authAny` — pass `id`, `role`, and `accessToken` in the body.
> The `role` field is one of: `"user"`, `"boss"`, `"organizer"`.

#### `POST /adventure/count`

Get the total message count for an adventure.

**Request body:**
```json
{
  "id": "number",
  "role": "string",
  "accessToken": "string",
  "adventureId": "number"
}
```

**Response:**
```json
{ "count": "number" }
```

---

#### `POST /adventure/get-messages`

Get messages in an adventure, paginated.

**Request body:**
```json
{
  "id": "number",
  "role": "string",
  "accessToken": "string",
  "adventureId": "number",
  "a": "number (from index)",
  "b": "number (to index)"
}
```

**Response:** Array of message objects.

---

#### `POST /adventure/get-event`

Get details of a specific event.

**Request body:**
```json
{
  "id": "number",
  "role": "string",
  "accessToken": "string",
  "eventId": "number"
}
```

---

#### `POST /adventure/create-poll`

Create a poll within an adventure.

**Request body:**
```json
{
  "id": "number",
  "role": "string",
  "accessToken": "string",
  "adventureId": "number",
  "question": "string",
  "options": ["string", "string", "..."]
}
```

**Response:**
```json
{ "pollNumber": "number" }
```

---

#### `POST /adventure/get-poll`

Get a poll's details and votes.

**Request body:**
```json
{
  "id": "number",
  "role": "string",
  "accessToken": "string",
  "adventureId": "number",
  "pollNumber": "number"
}
```

---

#### `POST /adventure/update-poll-add-vote`

Cast a vote on a poll option.

**Request body:**
```json
{
  "id": "number",
  "role": "string",
  "accessToken": "string",
  "adventureId": "number",
  "pollNumber": "number",
  "optionIndex": "number"
}
```

**Response:**
```json
{ "success": true }
```

---

#### `POST /adventure/update-poll-remove-vote`

Remove a vote from a poll option.

**Request body:**
```json
{
  "id": "number",
  "role": "string",
  "accessToken": "string",
  "adventureId": "number",
  "pollNumber": "number",
  "optionIndex": "number"
}
```

**Response:**
```json
{ "success": true }
```

---

#### `POST /adventure/insert-result`

Submit exam results. **Boss only** (`authBoss` — pass `bid` and `accessToken`).

**Request body:**
```json
{
  "bid": "number",
  "accessToken": "string",
  "adventureId": "number",
  "userIds": [1, 2, 3],
  "starScores": [5, 4, 3],
  "remarks": ["Great job", "Good effort", "Keep trying"],
  "badgeIds": [10, 11, 12]
}
```

> Arrays are parallel — `userIds[i]` receives `starScores[i]`, `remarks[i]`, and `badgeIds[i]`.

**Response:**
```json
{ "resultNumber": "number" }
```

---

#### `POST /adventure/get-result`

Get exam results. **Boss only** (`authBoss`).

**Request body:**
```json
{
  "bid": "number",
  "accessToken": "string",
  "adventureId": "number",
  "resultNumber": "number"
}
```

---

### Event (`/event`)

#### `POST /event/set-attendance`

Mark attendance for an event. **Organizer only** (`authOrganizer`).

**Request body:**
```json
{
  "oid": "number",
  "accessToken": "string",
  "eventId": "number",
  "attendance": [1, 4, 7]
}
```

> `attendance` is an array of user IDs who were present.

---

### Search (`/search`)

#### `POST /search/categories`

Get all adventure categories.

**Request body:**
```json
{
  "id": "number",
  "role": "string",
  "accessToken": "string"
}
```

**Response:** Array of category objects.

---

#### `POST /search/subcategories`

Get subcategories for a given category.

**Request body:**
```json
{
  "id": "number",
  "role": "string",
  "accessToken": "string",
  "category": "string"
}
```

---

#### `POST /search/badges`

Get badge(s) by category or by ID. Pass **one** of `categoryId` or `badgeId`.

**Request body:**
```json
{
  "id": "number",
  "role": "string",
  "accessToken": "string",
  "categoryId?": "number",
  "badgeId?": "number"
}
```

---

#### `POST /search/offers`

Get all current offers. **User only** (`authUser`).

**Request body:**
```json
{
  "uid": "number",
  "accessToken": "string"
}
```

---

#### `POST /search/lobbies`

Find compatible match lobbies. Two-way compatibility check is performed.

**Request body:**
```json
{
  "id": "number",
  "role": "string (user | boss)",
  "accessToken": "string",
  "categoryId": "number",
  "matchRadius": "number",
  "ageRangeMin": "number",
  "ageRangeMax": "number",
  "latitude": "number",
  "longitude": "number"
}
```

**Response:** Array of compatible match request objects.

---

#### `POST /search/random-adventure-name`

Generate a random fun adventure name based on the category. **Organizer only** (`authOrganizer`).

**Request body:**
```json
{
  "oid": "number",
  "accessToken": "string",
  "categoryId": "number"
}
```

**Response:**
```json
{ "suggestion": "The Quirky Puzzle" }
```

---

#### `POST /search/profile`

View another user's, boss's, or organizer's public profile.

**Request body:**
```json
{
  "id": "number",
  "role": "string",
  "accessToken": "string",
  "profileId": "number",
  "profileRole": "string (user | boss | organizer)"
}
```

**Response:**
```json
{
  "username": "string",
  "age": "number",
  "gender": "string",
  "setting_1": "boolean",
  "setting_2": "boolean",
  "icon": "string (base64) | null",
  "bio": "string"
}
```

---

### Mail (`/mail`)

> All routes require `authAny` — pass `id`, `role`, and `accessToken` in the body.

#### `POST /mail/send`

Send a notification to another person. Costs 1 gem if the sender is a user.

**Request body:**
```json
{
  "id": "number",
  "role": "string",
  "accessToken": "string",
  "message": "string",
  "receiverId": "number",
  "receiverRole": "string"
}
```

**Response:**
```json
{ "success": true }
// or
{ "success": false, "message": "Insufficient gems" }
```

---

#### `POST /mail/count`

Count notifications for the authenticated person.

**Request body:**
```json
{
  "id": "number",
  "role": "string",
  "accessToken": "string"
}
```

**Response:**
```json
{ "count": "number" }
```

---

#### `POST /mail/receive`

Get notifications, paginated.

**Request body:**
```json
{
  "id": "number",
  "role": "string",
  "accessToken": "string",
  "a": "number (offset)",
  "b": "number (limit)"
}
```

**Response:** Array of notification objects.

---

## Real-time: Adventure Chat (Socket.IO)

Adventure members can chat in real-time via Socket.IO rooms. Room names follow the format `{adventureId}_{roomSuffix}`.

### `join_room` (Client → Server)

```json
{
  "roomName": "string (e.g. '42_general')",
  "id": "number",
  "role": "string",
  "accessToken": "string"
}
```

Server broadcasts `"message"` → `"A user has joined!"` to the room.

### `send_message` (Client → Server)

```json
{
  "room": "string",
  "senderId": "number",
  "senderType": "string (user | boss | organizer)",
  "accessToken": "string",
  "message": "string"
}
```

Server broadcasts `"message"` → the message text to all room members. Message is persisted to the database.

### `leave_room` (Client → Server)

```json
{
  "roomName": "string",
  "id": "number",
  "role": "string",
  "accessToken": "string"
}
```

Server broadcasts `"message"` → `"A user has left!"` to the room.

### `message` (Server → Client)

Receive a broadcasted message string.

---

## File Uploads

Files are stored in Google Cloud Storage, scoped per adventure. The flow is:

1. **Get upload URL** — client requests a signed upload URL from the server.
2. **Upload directly** — client uploads the file to GCS using the signed URL.
3. **Get download URL** — client requests a signed download URL to access the file.

---

## Project Structure

```
src/
├── index.ts                  # Express + Socket.IO server setup
├── db.ts                     # PostgreSQL connection pool
├── utils.ts                  # Utility functions (age calculation, etc.)
├── controllers/
│   ├── authController.ts     # Signup & login flows (OTP + password)
│   ├── userController.ts     # User dashboard, profile, matchmaking
│   ├── bossController.ts     # Boss dashboard, profile, exams
│   ├── organizerController.ts# Organizer lobbies, events, adventures
│   ├── adventureController.ts# Chat, polls, file URLs, results + Socket.IO
│   ├── eventController.ts    # Event attendance
│   ├── searchController.ts   # Categories, lobbies, profiles, badges
│   ├── mailController.ts     # In-app notifications
│   └── moderatorController.ts# Admin operations
├── middlewares/
│   └── auth.ts               # Auth middlewares (role-based, reCAPTCHA, super token)
├── routes/                   # Express routers per domain
├── services/
│   ├── bucketService.ts      # Google Cloud Storage helpers
│   └── otpService.ts         # MSG91 OTP send/verify/retry
└── schedulers/
    └── index.ts              # Cron jobs
db/
├── schema.sql                # Full database schema
├── seed.ts                   # Database seeder
├── update.ts                 # Migration runner
└── migrations/               # SQL migration files
```
