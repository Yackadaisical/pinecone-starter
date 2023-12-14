import cheerio from 'cheerio';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import pdfParse from 'pdf-parse';

interface Page {
  url: string;
  content: string;
  company: string;
}

class Crawler {
  private seen = new Set<string>();
  private pages: Page[] = [];
  private queue: { url: string; depth: number }[] = [];

  constructor(private maxDepth = 2, private maxPages = 1) { }
  // In this specific configuration, the maxDepth setting effectively doesn't matter because maxPages is set to 1, which means the crawler will only ever process the initial URL and no additional pages. If you wanted the crawler to follow links and process more pages, you would need to increase maxPages to a number greater than 1.

  async crawl(startUrl: string): Promise<Page[]> {
    // Add the start URL to the queue
    this.addToQueue(startUrl);

    // While there are URLs in the queue and we haven't reached the maximum number of pages...
    while (this.shouldContinueCrawling()) {
      // Dequeue the next URL and depth
      const { url, depth } = this.queue.shift()!;

      // If the depth is too great or we've already seen this URL, skip it
      if (this.isTooDeep(depth) || this.isAlreadySeen(url)) continue;

      // Add the URL to the set of seen URLs
      this.seen.add(url);

      // Fetch the page HTML
      const html = await this.fetchPage(url);

      // Parse the HTML and add the page to the list of crawled pages
      this.pages.push({ url, content: this.parseHtml(html) });

      // Extract new URLs from the page HTML and add them to the queue
      this.addNewUrlsToQueue(this.extractUrls(html, url), depth);
    }

    // Return the list of crawled pages
    return this.pages;
  }

  private isTooDeep(depth: number) {
    return depth > this.maxDepth;
  }

  private isAlreadySeen(url: string) {
    return this.seen.has(url);
  }

  private shouldContinueCrawling() {
    return this.queue.length > 0 && this.pages.length < this.maxPages;
  }

  private addToQueue(url: string, depth = 0) {
    this.queue.push({ url, depth });
  }

  private addNewUrlsToQueue(urls: string[], depth: number) {
    this.queue.push(...urls.map(url => ({ url, depth: depth + 1 })));
  }

  private async fetchPage(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (url.endsWith('.pdf')) {
        // Handle PDF files
        const buffer = await response.arrayBuffer();
        // Send the PDF buffer to the serverless function for parsing
        const parseResponse = await fetch('/api/crawl/parse-pdf', {
          method: 'POST',
          body: buffer,
        });
        const parsedData = await parseResponse.json();
        return parsedData.text; // Extracted text content from PDF
      } else {
        // Handle non-PDF content
        return await response.text();
      }
    } catch (error) {
      console.error(`Failed to fetch ${url}: ${error}`);
      return '';
    }
  }

  private parseHtml(html: string): string {
    const $ = cheerio.load(html);
    $('a').removeAttr('href');
    return NodeHtmlMarkdown.translate($.html());
  }

  private extractUrls(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html);
    const relativeUrls = $('a').map((_, link) => $(link).attr('href')).get() as string[];
    return relativeUrls.map(relativeUrl => new URL(relativeUrl, baseUrl).href);
  }
}

export { Crawler };
export type { Page };
