// Example: Sentry integration for Express backend
// Install: pnpm add @sentry/node

const Sentry = require('@sentry/node');

Sentry.init({
    dsn: process.env.SENTRY_DSN, // Set this in your environment variables
    tracesSampleRate: 1.0, // Adjust for production
});

// In your server.js, add before other middleware:
// app.use(Sentry.Handlers.requestHandler());
// app.use(Sentry.Handlers.errorHandler());

// To capture errors manually:
// Sentry.captureException(new Error('Something went wrong')); 