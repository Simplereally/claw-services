import { Router, Request, Response } from 'express';
import { createContext } from '../lib/browser.js';

const router = Router();

interface TweetRequest {
  text: string;
  ct0?: string;
  auth_token?: string;
}

interface TweetResponse {
  success: boolean;
  url?: string;
  error?: string;
}

router.post('/', async (req: Request<{}, TweetResponse, TweetRequest>, res: Response<TweetResponse>) => {
  const startTime = Date.now();
  const { text, ct0, auth_token } = req.body;
  
  // Use request body or fall back to env vars
  const CT0 = ct0 || process.env.CT0;
  const AUTH_TOKEN = auth_token || process.env.AUTH_TOKEN;
  
  console.log(`[${new Date().toISOString()}] POST /api/tweet - text length: ${text?.length || 0}`);
  
  if (!text) {
    return res.status(400).json({ success: false, error: 'Missing required field: text' });
  }
  
  if (!CT0 || !AUTH_TOKEN) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing Twitter credentials. Provide ct0 and auth_token in body or set CT0 and AUTH_TOKEN env vars' 
    });
  }
  
  let context = null;
  let page = null;
  
  try {
    context = await createContext([
      { name: 'ct0', value: CT0, domain: '.x.com', path: '/', secure: true, sameSite: 'Lax' },
      { name: 'auth_token', value: AUTH_TOKEN, domain: '.x.com', path: '/', httpOnly: true, secure: true, sameSite: 'Lax' }
    ]);
    
    page = await context.newPage();
    
    await page.goto('https://x.com/compose/post', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 20000 });
    await page.click('[data-testid="tweetTextarea_0"]');
    await page.keyboard.type(text, { delay: 50 });
    await page.waitForTimeout(1500);
    await page.click('[data-testid="tweetButton"]');
    await page.waitForTimeout(4000);
    
    const url = page.url();
    const duration = Date.now() - startTime;
    
    if (url.includes('/status/')) {
      console.log(`[${new Date().toISOString()}] Tweet posted: ${url} (${duration}ms)`);
      return res.json({ success: true, url });
    } else {
      console.log(`[${new Date().toISOString()}] Tweet sent (no URL captured) (${duration}ms)`);
      return res.json({ success: true });
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${new Date().toISOString()}] Tweet failed: ${message} (${duration}ms)`);
    return res.status(500).json({ success: false, error: message });
    
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
  }
});

export default router;
