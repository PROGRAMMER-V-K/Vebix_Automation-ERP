# Vebix Automation ERP

Cross-platform **Enterprise Resource Planning** app built with **Expo** and **React Native**. Manage inventory, sales, finance, HR, and employee attendance from web and mobile.

## Features

- **Dashboard** — department workspaces with sidebar (desktop) and mobile navigation
- **Authentication** — email/password and Google Sign-In with persistent sessions
- **Attendance** — clock in/out, daily hours, weekly stats, history in **Firebase Firestore**
- **Responsive UI** — split login on desktop; compact layout on phone

## Tech stack

| Layer | Technology |
|--------|------------|
| Framework | Expo SDK 54, Expo Router |
| Language | TypeScript |
| UI | React Native |
| Backend | Firebase Auth, Cloud Firestore |
| Storage | AsyncStorage (auth persistence on mobile) |

## Project structure

```
app/
  (auth)/          # Login / sign-up screens
  (dashboard)/     # ERP home + department routes
  _layout.tsx      # Root layout, auth provider, navigation guard
components/
  auth/            # Login UI, route protection
  horizon/         # Sidebar, dashboard shell, department cards
  attendance/      # Attendance UI
constants/         # Brand colors, navigation items, theme tokens
contexts/          # Auth state (Firebase)
hooks/             # Attendance, Google sign-in, sign-out
lib/               # Firebase, Firestore attendance, auth helpers
types/             # Shared TypeScript types
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy the example file and fill in your Firebase / Google credentials:

```bash
copy .env.example .env
```

Required variables (see `.env.example`):

- `EXPO_PUBLIC_FIREBASE_*` — from Firebase Console → Project settings → Web app
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` — from Firebase → Authentication → Google → Web client ID

### 3. Firebase setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Firestore Database**
3. Enable **Authentication** → Email/Password and **Google**
4. Deploy rules from `firestore.rules.example` (adjust for production)

Firestore path for attendance:

```
users/{userId}/attendance/{date}
```

### 4. Google Sign-In (mobile / Expo Go)

Add authorized redirect URIs in [Google Cloud Console](https://console.cloud.google.com/) → Credentials → Web client:

- `https://auth.expo.io/@YOUR_EXPO_USERNAME/erp` (Expo Go)
- `erp://oauth` (standalone builds)

The login screen shows the exact Expo Go redirect URI when applicable.

### 5. Run the app

```bash
npx expo start
```

Clear cache after config changes:

```bash
npx expo start -c
```

- **Web:** press `w` or open `http://localhost:8081`
- **Android/iOS:** scan QR with Expo Go

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run web` | Start for web |
| `npm run android` | Start for Android |
| `npm run ios` | Start for iOS |
| `npm run lint` | Run ESLint |

## License

Private — Vebix Automation.
