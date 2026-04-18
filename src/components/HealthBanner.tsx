/**
 * HealthBanner — INTERNAL / ADMIN USE ONLY.
 *
 * This component is intentionally not rendered in the production UI.
 * Health status is monitored silently via the logger and healthCheck
 * services. Service outages are surfaced through structured logs
 * (console in dev, CloudWatch / Datadog in production) rather than
 * user-facing banners.
 *
 * Rationale: A polished educational platform should never expose raw
 * infrastructure status to students. If a service call fails, the
 * individual component that made the call shows a friendly contextual
 * message (e.g. "Unable to load labs right now — please try again").
 */

export {};
