# Epic 10 — Observability (Datadog)

> Goal: Full observability stack — logs, traces, metrics — for both the application layer and the hosting infrastructure.

Split into two tracks because they have different prerequisites: applicative observability can be set up before deployment, while infrastructure monitoring requires a live environment.

---

## Track A — Applicative Observability

Instruments the Next.js application itself. Can be developed and tested locally.

---

#### T10.1 — Datadog agent setup & local dev environment

**Description:** Add the Datadog agent to the Docker Compose stack for local development. Configure it to receive traces, metrics, and logs from the app container.

**Tasks:**
- Add `datadog-agent` service to `docker-compose.yml` (or `docker-compose.dev.yml`)
- Configure `DD_API_KEY`, `DD_SITE`, `DD_APM_ENABLED`, `DD_LOGS_ENABLED` via env vars
- Verify agent is reachable from the app container
- Document the setup in README

**Acceptance criteria:**
- [ ] `docker compose up` starts the Datadog agent alongside the app
- [ ] Agent health check passes (`docker exec agent agent status`)

---

#### T10.2 — Application tracing (APM)

**Description:** Instrument the Next.js application with Datadog APM to capture request traces across server components, API routes, and middleware.

**Tasks:**
- Install `dd-trace` (Datadog Node.js tracing library)
- Configure tracer initialization (service name, environment, version)
- Verify traces appear in Datadog APM for API routes (`/api/login`, `/api/rsvp`, `/api/admin/*`)
- Add custom spans for key operations (session verification, Prisma queries)
- Tag traces with relevant metadata (invitation ID, admin ID, route)

**Acceptance criteria:**
- [ ] All API routes produce traces visible in Datadog APM
- [ ] Prisma queries appear as spans within traces
- [ ] Service map shows the app and its database dependency

---

#### T10.3 — Structured logging

**Description:** Replace `console.log`/`console.error` with structured JSON logging that Datadog can ingest, parse, and correlate with traces.

**Tasks:**
- Choose a logging approach: `dd-trace` log injection (correlates logs ↔ traces automatically) or a lightweight structured logger (e.g., `pino`)
- Add trace ID / span ID to all log lines for correlation
- Log key events: login success/failure, RSVP submission, admin actions (create/edit/delete invitation)
- Configure Datadog log pipeline to parse the JSON format
- Set log levels appropriately (info for business events, error for failures, debug for dev)

**Acceptance criteria:**
- [ ] All logs are structured JSON with trace correlation IDs
- [ ] Logs visible in Datadog Log Explorer
- [ ] Clicking a log line navigates to the associated trace

---

#### T10.4 — Application metrics (custom)

**Description:** Emit custom metrics for business and operational KPIs.

**Metrics to track:**

| Metric | Type | Tags | Purpose |
|--------|------|------|---------|
| `wedding.rsvp.submitted` | Count | `status:confirmed\|declined` | Track RSVP activity |
| `wedding.rsvp.attending_count` | Gauge | — | Total confirmed attendees |
| `wedding.login.guest` | Count | `success:true\|false` | Guest login rate |
| `wedding.login.admin` | Count | `success:true\|false` | Admin login attempts |
| `wedding.invitation.created` | Count | — | New invitations created |
| `wedding.invitation.deleted` | Count | — | Invitations deleted |
| `wedding.api.latency` | Distribution | `route`, `method`, `status` | API response times |
| `wedding.middleware.latency` | Distribution | `path_pattern` | Middleware overhead |

**Tasks:**
- Use `dd-trace` StatsD client or Datadog's `dogstatsd` to emit metrics
- Add metric emission at key points in the code (API routes, middleware)
- Create a Datadog dashboard with the above metrics
- Set up basic monitors/alerts (e.g., admin login failure spike)

**Acceptance criteria:**
- [ ] All listed metrics appear in Datadog Metrics Explorer
- [ ] Dashboard shows RSVP status, login activity, and API latency
- [ ] At least one monitor configured (admin login failures)

---

#### T10.5 — Error tracking

**Description:** Capture and track application errors in Datadog.

**Tasks:**
- Enable Datadog error tracking via `dd-trace` error collection
- Ensure unhandled errors in API routes and server components are captured
- Add source maps for meaningful stack traces in production
- Configure error alerts for critical paths (auth failures, database errors)

**Acceptance criteria:**
- [ ] Errors appear in Datadog Error Tracking
- [ ] Stack traces are readable (source maps working)
- [ ] Alert fires on elevated error rate

---

## Track B — Infrastructure Observability

Monitors the hosting environment. Requires a deployed production/staging environment.

---

#### T10.6 — Infrastructure agent & host metrics

**Description:** Deploy the Datadog agent on the production host to collect system-level metrics.

**Metrics:**
- CPU, memory, disk usage, network I/O
- Container metrics (if Docker-based deployment)
- Process-level metrics for Node.js (event loop lag, heap usage, GC pauses)

**Tasks:**
- Install Datadog agent on production host (or as a sidecar container)
- Enable Docker integration if applicable
- Enable Node.js runtime metrics via `dd-trace` (`runtimeMetrics: true`)
- Create infrastructure dashboard

**Acceptance criteria:**
- [ ] Host appears in Datadog Infrastructure list
- [ ] CPU, memory, disk metrics visible
- [ ] Node.js runtime metrics (heap, event loop) visible

---

#### T10.7 — Database monitoring

**Description:** Monitor the database layer.

**Tasks:**
- For SQLite: limited built-in monitoring — track file size, WAL size, query latency via custom metrics
- For PostgreSQL (if migrated): enable Datadog PostgreSQL integration — query metrics, connection pool, slow queries
- Add Prisma query timing as custom metrics or spans (may already be covered by T10.2)

**Acceptance criteria:**
- [ ] Database query latency visible in Datadog
- [ ] Slow query alerts configured (if PostgreSQL)

---

#### T10.8 — Uptime monitoring & synthetic tests

**Description:** Monitor site availability and critical user flows from outside.

**Tasks:**
- Set up Datadog Synthetics API tests:
  - Gate page loads (HTTP 200 on `/fr`)
  - Login endpoint responds (HTTP 302 on `/api/login?token=...`)
  - Admin login page loads (HTTP 200 on `/admin/login`)
- Set up browser test for critical flow: gate → login → home page
- Configure alerting on downtime (PagerDuty, Slack, email)

**Acceptance criteria:**
- [ ] Synthetic tests run on a schedule (every 5 min)
- [ ] Alerts fire within 5 minutes of downtime
- [ ] SLA dashboard shows uptime percentage

---

#### T10.9 — Observability dashboard & runbook

**Description:** Create a unified dashboard and operational runbook.

**Tasks:**
- Build a single "Wedding Site Overview" dashboard combining:
  - Application: request rate, error rate, latency (RED metrics)
  - Business: RSVP count, login activity, gallery views
  - Infrastructure: CPU, memory, disk, Node.js runtime
- Write a runbook documenting:
  - How to investigate common alerts
  - How to restart the service
  - How to check database health
  - Contact/escalation (it's just you, but good practice)

**Acceptance criteria:**
- [ ] Dashboard exists and shows all three layers
- [ ] Runbook documented in `docs/runbook.md`
