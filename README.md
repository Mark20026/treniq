# Treniq

Treniq connects trainers and their clients through a web dashboard and a mobile application. This repository contains the existing applications, adapted for an independent local installation.

| Directory | Application |
| --- | --- |
| `web/` | Next.js trainer dashboard, public website, server endpoints, and Supabase database migrations |
| `mobile/` | Expo / React Native client application for assigned plans, workout logs, measurements, progress, files, appointments, and chat |

Both applications use the same Supabase Auth, PostgreSQL, Storage, and Realtime services. The mobile application connects directly to Supabase. The web server supplies authenticated trainer account-management endpoints.

## Requirements

- Node.js **24.15.0** and npm; each application includes `.nvmrc` and its own `package-lock.json`.
- Docker Desktop running, and Supabase CLI **2.106.0** for the local backend. Follow the [official local development instructions](https://supabase.com/docs/guides/local-development/cli/getting-started) to install the CLI. Use the pinned version for the commands below.
- Optional native development: Xcode and an iOS simulator on macOS, or Android Studio with its SDK and an emulator.

No hosted account, production credentials, existing database, or project linking is required. The local stack is named `treniq-public-local`; it uses ports **56420–56424** so it can run independently of other local projects.

## 1. Start the backend

```sh
git clone https://github.com/Mark20026/treniq.git
cd treniq/web
supabase start
supabase status
```

Startup applies the checked-in migrations automatically to a new local database. The migrations contain the core schema, relationships, access policies, notification triggers, Realtime publication membership, and private file buckets. No application records or accounts are included.

The local dashboard is at [127.0.0.1:56423](http://127.0.0.1:56423) and the local mail inbox is at [127.0.0.1:56424](http://127.0.0.1:56424). `supabase status` reports the local API URL, anonymous key, and service-role key. Keep these values in ignored environment files; the service-role key belongs only on the web server.

Use this stack on a trusted development computer. The CLI may publish Docker ports to network interfaces. Keep the dashboard and database inaccessible from untrusted networks. These migrations are intended for a **new local installation**; do not apply them to an existing hosted database.

## 2. Configure and run the web app

From `web/`:

```sh
nvm use
npm ci
cp .env.example .env.local
```

Edit `.env.local` with the local values from `supabase status`:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:56421` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Local anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Local service-role key; server only |

```sh
npm run dev
```

Open [localhost:3000/en](http://localhost:3000/en). Hungarian (`/hu`) and Slovak (`/sk`) are also available. To run a production build locally:

```sh
npm run typecheck
npm run build
npm start
```

Register a trainer account in the web application and finish onboarding. Local email confirmation is disabled. Password-reset emails are delivered to the local mail inbox, and their links open the web password-reset screen.

### Create a client and an exercise catalog

1. In the trainer dashboard, add a client **with an email address**. The web server creates the corresponding mobile login and displays a generated initial password. Save it and give it to the client securely. An entry without an email is an offline client record and cannot log in to the mobile app.
2. The exercise catalog starts empty. In the local dashboard's Table Editor, add entries to `public.master_exercises`. Enter `name`, `muscle_group` (for example `legs` or `cardio`), and optional `equipment`, `difficulty`, description, and localized `name_en`, `name_hu`, or `name_sk`. The ID is generated automatically. Use your own catalog content.
3. Create a workout plan for the client, then select catalog exercises and assign them to weekdays. Set the prescribed sets, repetitions, load, rest time, or cardio fields.
4. Create meal plans, appointments, and measurements from the client's detail page and calendar as needed.

Subscription screens are retained as local application screens. They do not process payments or provision a commercial subscription. Optional remote push delivery requires your own Expo project and separate server-side delivery configuration; local reminders, in-app notifications, and Realtime updates are available without it.

## 3. Configure and run the mobile app

Open a second terminal:

```sh
cd treniq/mobile
nvm use
npm ci
cp .env.example .env
```

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` to the **same backend** as the web app. Never put a service-role key in the mobile app.

| Runtime | Backend URL |
| --- | --- |
| Browser or iOS simulator on the same computer | `http://127.0.0.1:56421` |
| Standard Android emulator | `http://10.0.2.2:56421` |
| Physical device on your trusted LAN | Your development computer's LAN IP with port `56421` |

Start the browser version:

```sh
npm run web
```

For native development builds:

```sh
npm run ios       # macOS + Xcode
# or
npm run android   # Android SDK + emulator/device
```

These commands generate native project directories locally. Those generated directories are ignored by Git. Use a development build for native modules; do not assume that a particular Expo Go installation supports them. Once a development build is installed, `npm start` starts Metro for it. See the [Expo development build guide](https://docs.expo.dev/develop/development-builds/introduction/).

Log in with the email and generated password created by the trainer. Assigned workout plans, logged workouts, body measurements, meal plans, appointments, and chat share the local backend with the trainer dashboard. Native file sharing and device notifications require a simulator/device with the relevant permissions. Browser mode is convenient for reviewing screens, but does not replace native device verification.

`EXPO_PUBLIC_EAS_PROJECT_ID` is optional. Leave it empty for a local review. To enable push registration in your own native development build, set it to your own Expo project ID. Stop and restart Metro after changing environment variables.

## Local database lifecycle

Run these commands from `web/`:

```sh
supabase stop             # stop this local stack
supabase start            # start it again
supabase db reset --local # erase this local stack's data and replay migrations
```

Reset is destructive to this disposable local database. Keep this checkout unlinked from hosted projects and check the working directory before running database commands.

Files are stored in private buckets. The applications persist object paths and generate short-lived signed download URLs for authorized participants. Uploaded files and account data stay in your own local backend and are not part of this repository.

## Verification

The release was checked with Node.js 24.15.0 and Supabase CLI 2.106.0:

- Clean npm dependency installation and TypeScript checks for both applications.
- Next.js production build and production-server startup; all three landing-page locales returned HTTP 200.
- Expo startup and web bundle delivery; iOS and Android JavaScript/Hermes exports completed.
- Fresh local database migration application and 47 runtime/API checks covering trainer/client authentication, assigned workouts, workout history, measurements, meal plans, appointments, chat, notifications, private downloads, and rejection of unauthorized account and cross-trainer operations.
- Review of publication files for credentials, environment files, unrelated modules, and build output.

Interactive browser verification and native simulator/device execution were **not completed**. Bundle generation does not certify every native interaction. Camera/document permissions, native file sharing, optional remote push delivery, and password-reset email navigation require manual review in the relevant runtime.

## Publishing future updates safely

1. Keep this public checkout separate from your working applications. Do not attach a private repository's history or use a mirror push.
2. Create a branch in this repository, for example `git switch -c release/update-client-screens`. Copy only the application files needed for the change into `web/` or `mobile/`. Do not copy whole directories containing hidden configuration, local data, generated output, or history.
3. Review imports, routes, strings, configuration, SQL, and dependencies for anything outside the public applications' scope. Keep `.env.example` files generic and actual `.env` files ignored. Update lockfiles through npm when dependencies change.
4. In each app, run `npm ci` and `npm run typecheck`. Build the web app and export the mobile app with `npx expo export --platform ios --platform android`. Run both against a disposable local backend, and manually check the affected screens on a device/simulator.
5. Before staging, run a reputable secret scanner such as [Gitleaks](https://github.com/gitleaks/gitleaks). Stage explicit paths, inspect `git diff --cached --stat`, `git diff --cached`, and `git status`, and confirm `git remote -v` names this repository. Review new binary assets as well as text files.
6. Commit only the reviewed files, push the release branch, and review its pull request before merging. Repeat verification after any fixes.

If a credential is ever published, revoke or rotate it first. Removing a file in a later commit leaves earlier versions accessible. Rewrite all affected branches and tags when appropriate, and contact GitHub Support for cached views or pull-request references. Rewriting this repository cannot remove copies held in other repositories, forks, clones, archives, or third-party caches. This repository starts with independent history; it does not erase earlier publications elsewhere. See [GitHub's sensitive-data removal guide](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).
