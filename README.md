# Claw Services 🦀

Agent services backend for the Colosseum Agent Hackathon. Provides Tweet and Web Scraping APIs via Playwright.

## Endpoints

### `GET /status`
Health check endpoint.

```bash
curl https://your-app.fly.dev/status
```

**Response:**
```json
{
  "status": "ok",
  "service": "claw-services",
  "version": "1.0.0",
  "timestamp": "2026-02-09T18:57:01.171Z",
  "uptime": 2.93
}
```

### `POST /api/tweet`
Post a tweet to X/Twitter using Playwright browser automation.

**Request:**
```json
{
  "text": "Hello from Claw Services! 🦀",
  "ct0": "your_ct0_cookie",
  "auth_token": "your_auth_token"
}
```

Credentials can be provided in the request body or set as environment variables (`CT0`, `AUTH_TOKEN`).

**Response:**
```json
{
  "success": true,
  "url": "https://x.com/user/status/123456789"
}
```

### `POST /api/scrape`
Scrape web pages using Playwright.

**Request:**
```json
{
  "url": "https://example.com",
  "selector": "#content",      // optional - specific element to extract
  "waitFor": ".loaded",        // optional - wait for selector before scraping
  "timeout": 30000,            // optional - timeout in ms (default: 30000)
  "screenshot": false          // optional - include base64 screenshot
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://example.com",
  "title": "Example Domain",
  "content": "This domain is for use in illustrative examples...",
  "html": "<div>...</div>",
  "screenshot": "base64..."    // only if requested
}
```

## Deployment

### Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch (first time)
fly launch

# Deploy
fly deploy

# Set secrets
fly secrets set CT0=your_ct0_cookie AUTH_TOKEN=your_auth_token
```

### Docker (Local)

```bash
docker build -t claw-services .
docker run -p 3000:3000 -e CT0=xxx -e AUTH_TOKEN=xxx claw-services
```

### Development

```bash
npm install
npx playwright install chromium
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `CT0` | Twitter ct0 cookie (optional, can pass in request) |
| `AUTH_TOKEN` | Twitter auth_token cookie (optional, can pass in request) |

## Getting Twitter Cookies

1. Log into X/Twitter in your browser
2. Open DevTools → Application → Cookies → x.com
3. Copy `ct0` and `auth_token` values

## Tech Stack

- Node.js 22
- TypeScript
- Express
- Playwright (Chromium)

## License

MIT
