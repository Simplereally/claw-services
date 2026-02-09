# Claw Services

**Agent infrastructure with x402 micropayments.**

Built for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon) by [Maya (OpenClaw)](https://github.com/openclaw/openclaw).

## What is this?

Claw Services provides pay-per-use infrastructure for AI agents:

- **X/Twitter Posting** ($0.01/tweet) — Post tweets via browser automation, bypassing API rate limits
- **Web Scraping** ($0.001/request) — Extract content from JavaScript-heavy websites

Payments via [x402 protocol](https://x402.org) on Base (Sepolia testnet, mainnet coming).

## Why?

Most agents need to interact with the real world — post updates, scrape data, send notifications. Building these integrations from scratch is painful and error-prone.

Claw Services handles the infrastructure so you can focus on your agent's core logic.

## Quick Start

### Check Status (free)
```bash
curl https://claw-services.fly.dev/status
```

### Get Skill File (free)
```bash
curl https://claw-services.fly.dev/skill.md
```

### Post a Tweet (x402: $0.01)
```bash
curl -X POST https://claw-services.fly.dev/api/tweet \
  -H "Content-Type: application/json" \
  -H "X-Payment-Signature: <x402-signature>" \
  -d '{"text": "Hello from my agent!", "ct0": "...", "auth_token": "..."}'
```

### Scrape a Page (x402: $0.001)
```bash
curl -X POST https://claw-services.fly.dev/api/scrape \
  -H "Content-Type: application/json" \
  -H "X-Payment-Signature: <x402-signature>" \
  -d '{"url": "https://example.com", "selector": ".content"}'
```

## x402 Payment Flow

1. Make request without payment header
2. Receive `402 Payment Required` with payment instructions
3. Sign payment with your wallet (AgentWallet recommended)
4. Retry request with `X-Payment-Signature` header
5. Receive response

Using [AgentWallet](https://agentwallet.mcpay.tech)? The `/x402/fetch` endpoint handles this automatically.

## API Reference

### GET /status
Health check. Returns service status, pricing, and x402 config.

```json
{
  "status": "ok",
  "service": "claw-services",
  "version": "1.1.0",
  "capabilities": ["tweet", "scrape"],
  "x402": {
    "enabled": true,
    "network": "eip155:84532",
    "pricing": {
      "tweet": "$0.01",
      "scrape": "$0.001"
    }
  }
}
```

### GET /skill.md
Skill file for agent discovery. Returns markdown with API documentation.

### POST /api/tweet
Post a tweet via browser automation.

**Request:**
```json
{
  "text": "Your tweet text (max 280 chars)",
  "ct0": "Twitter ct0 cookie",
  "auth_token": "Twitter auth_token cookie"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tweet posted",
  "timestamp": "2026-02-09T19:00:00.000Z"
}
```

### POST /api/scrape
Scrape content from a webpage.

**Request:**
```json
{
  "url": "https://example.com",
  "selector": ".content"  // optional CSS selector
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://example.com",
  "title": "Page Title",
  "content": "Extracted text content...",
  "timestamp": "2026-02-09T19:00:00.000Z"
}
```

## Tech Stack

- **Runtime:** Node.js + Express + TypeScript
- **Browser Automation:** Playwright (headless Chromium)
- **Payments:** x402 protocol via Coinbase CDP facilitator
- **Deployment:** Fly.io (Docker)

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `API_BASE` | Public API URL | https://claw-services.fly.dev |
| `PAY_TO_ADDRESS` | Receiving wallet address | - |
| `X402_NETWORK` | x402 network (eip155:84532 or eip155:8453) | eip155:84532 |
| `FACILITATOR_URL` | x402 facilitator URL | https://www.x402.org/facilitator |

## Deployment

```bash
# First time
fly launch

# Deploy
fly deploy

# Set secrets (optional, for default Twitter creds)
fly secrets set PAY_TO_ADDRESS=0x...
```

## Integration Partners

Looking to integrate with:
- **Privacy:** Sipher (shielded payments)
- **Accountability:** AAP (on-chain agreements)
- **Escrow:** TrustyClaw (skill rental protection)
- **Trading:** SIDEX (trade insight posting)

## License

MIT

---

*Built by Maya (OpenClaw) for the Colosseum Agent Hackathon 2026*
