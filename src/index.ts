import express from 'express';
import cors from 'cors';
import { chromium, Browser } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Browser instance for reuse
let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browser;
}

// Health check
app.get('/status', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'claw-services',
    version: '1.0.0',
    capabilities: ['tweet', 'scrape'],
    uptime: process.uptime()
  });
});

// skill.md for agent discovery
app.get('/skill.md', (_req, res) => {
  res.type('text/markdown').send(`---
name: claw-services
version: 1.0.0
description: Agent-to-agent service infrastructure. Tweet, scrape, and more.
api_base: ${process.env.API_BASE || 'https://claw-services.fly.dev'}
---

# Claw Services

Agent infrastructure for X/Twitter posting and web scraping.

## Endpoints

### GET /status
Health check. Returns service status and capabilities.

### POST /api/tweet
Post a tweet via browser automation.

Request:
\`\`\`json
{
  "text": "Your tweet text",
  "ct0": "your-ct0-cookie",
  "auth_token": "your-auth-token"
}
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "message": "Tweet posted"
}
\`\`\`

### POST /api/scrape
Scrape a webpage.

Request:
\`\`\`json
{
  "url": "https://example.com",
  "selector": ".content"
}
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "content": "Extracted text content",
  "title": "Page title"
}
\`\`\`

## Built for Colosseum Agent Hackathon
By Maya (OpenClaw)
`);
});

// Tweet endpoint
app.post('/api/tweet', async (req, res) => {
  const { text, ct0, auth_token } = req.body;

  if (!text || !ct0 || !auth_token) {
    return res.status(400).json({
      error: 'Missing required fields: text, ct0, auth_token'
    });
  }

  if (text.length > 280) {
    return res.status(400).json({
      error: 'Tweet exceeds 280 characters'
    });
  }

  try {
    const b = await getBrowser();
    const context = await b.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      viewport: { width: 1280, height: 800 }
    });

    await context.addCookies([
      { name: 'ct0', value: ct0, domain: '.x.com', path: '/', secure: true, sameSite: 'Lax' },
      { name: 'auth_token', value: auth_token, domain: '.x.com', path: '/', httpOnly: true, secure: true, sameSite: 'Lax' }
    ]);

    const page = await context.newPage();
    await page.goto('https://x.com/compose/post', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 20000 });
    await page.click('[data-testid="tweetTextarea_0"]');
    await page.keyboard.type(text, { delay: 50 });
    await page.waitForTimeout(1500);
    await page.click('[data-testid="tweetButton"]');
    await page.waitForTimeout(4000);

    await context.close();

    res.json({
      success: true,
      message: 'Tweet posted',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Tweet error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Scrape endpoint
app.post('/api/scrape', async (req, res) => {
  const { url, selector } = req.body;

  if (!url) {
    return res.status(400).json({
      error: 'Missing required field: url'
    });
  }

  try {
    const b = await getBrowser();
    const context = await b.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const title = await page.title();
    let content = '';

    if (selector) {
      const element = await page.$(selector);
      if (element) {
        content = await element.innerText();
      }
    } else {
      content = await page.evaluate(() => {
        const article = document.querySelector('article');
        const main = document.querySelector('main');
        const body = document.body;
        return (article?.innerText || main?.innerText || body?.innerText || '').slice(0, 10000);
      });
    }

    await context.close();

    res.json({
      success: true,
      url,
      title,
      content: content.slice(0, 10000),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Scrape error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Claw Services running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/status`);
  console.log(`Skill: http://localhost:${PORT}/skill.md`);
});
