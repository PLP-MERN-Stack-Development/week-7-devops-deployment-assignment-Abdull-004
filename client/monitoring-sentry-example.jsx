// Example: Sentry integration for React frontend
// Install: pnpm add @sentry/react @sentry/tracing

import * as Sentry from '@sentry/react';

Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN, // Set this in your Vercel environment variables
    tracesSampleRate: 1.0, // Adjust for production
});

// Wrap your app in Sentry.ErrorBoundary for error tracking:
// <Sentry.ErrorBoundary fallback={<p>An error has occurred</p>}>
//   <App />
// </Sentry.ErrorBoundary> 