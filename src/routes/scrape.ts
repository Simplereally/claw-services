import { Router, Request, Response } from 'express';
import { createContext } from '../lib/browser.js';

const router = Router();

interface ScrapeRequest {
  url: string;
  selector?: string;
  waitFor?: string;
  timeout?: number;
  screenshot?: boolean;
}

interface ScrapeResponse {
  success: boolean;
  url?: string;
  title?: string;
  content?: string;
  html?: string;
  screenshot?: string; // base64
  error?: string;
}

router.post('/', async (req: Request<{}, ScrapeResponse, ScrapeRequest>, res: Response<ScrapeResponse>) => {
  const startTime = Date.now();
  const { url, selector, waitFor, timeout = 30000, screenshot = false } = req.body;
  
  console.log(`[${new Date().toISOString()}] POST /api/scrape - url: ${url}`);
  
  if (!url) {
    return res.status(400).json({ success: false, error: 'Missing required field: url' });
  }
  
  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid URL format' });
  }
  
  let context = null;
  let page = null;
  
  try {
    context = await createContext();
    page = await context.newPage();
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    
    // Wait for optional selector
    if (waitFor) {
      await page.waitForSelector(waitFor, { timeout: timeout / 2 });
    }
    
    const title = await page.title();
    
    let content: string | undefined;
    let html: string | undefined;
    
    if (selector) {
      // Get specific element
      const element = await page.$(selector);
      if (element) {
        content = await element.textContent() || undefined;
        html = await element.innerHTML();
      }
    } else {
      // Get full page text content
      content = await page.evaluate(() => document.body.innerText);
      html = await page.content();
    }
    
    let screenshotBase64: string | undefined;
    if (screenshot) {
      const buffer = await page.screenshot({ type: 'png', fullPage: false });
      screenshotBase64 = buffer.toString('base64');
    }
    
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Scrape complete: ${url} (${duration}ms)`);
    
    return res.json({
      success: true,
      url: page.url(),
      title,
      content: content?.slice(0, 50000), // Limit content size
      html: html?.slice(0, 100000), // Limit HTML size
      screenshot: screenshotBase64
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${new Date().toISOString()}] Scrape failed: ${message} (${duration}ms)`);
    return res.status(500).json({ success: false, error: message });
    
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
  }
});

export default router;
