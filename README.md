# Pull Request

Version: 0.1.5

A mobile-first workout logging web app for people using ChatGPT as an adaptive workout coach.

## What it does

- Setup prompt for your ChatGPT workout coach
- Daily check-in prompt generator
- Workout import from a structured ChatGPT response
- Gym-friendly actuals logging
- Coach update export
- Local browser history using localStorage

## Privacy note

This version stores profile and workout history in the browser's localStorage. There is no server, no login, and no database.

The GitHub-ready version intentionally uses blank/default profile fields so personal information is not published in your source code.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL Vite gives you.

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

This repo includes `.github/workflows/deploy.yml`.

After uploading the files to GitHub:

1. Go to your repository's Settings.
2. Go to Pages.
3. Under Build and deployment, set Source to GitHub Actions.
4. Push to `main`.
5. Wait for the Actions workflow to finish.
6. Open the Pages URL.
7. On iPhone Safari, use Share > Add to Home Screen.

