import cheerio from 'cheerio';
import { NodeHtmlMarkdown } from 'node-html-markdown';

interface Page {
  url: string;
  content: string;
  company: string;
}

class Crawler {
  // a class is a blueprint for creating objects. A class encapsulates data for the object and methods to manipulate that data.
  // For example, a Car class might have properties like color and make, and methods like drive() and stop().
  // An object is An instance of a class. If you create a new Car, you have an object that follows the rules and structure defined by the Car class.

  private seen = new Set<string>();
  // Private is a keyword that makes a property or method accessible only within the class itself. This is used for encapsulation, which means that the internal state of the object can only be changed by the object's own methods.
  private pages: Page[] = [];
  private queue: { url: string; depth: number }[] = [];

  constructor(private maxDepth = 2, private maxPages = 1) { }
  // A special method within a class that gets called when you create a new instance of the class. It's often used to set up the initial state of the object.
  // the maxDepth setting effectively doesn't matter because maxPages is set to 1, which means the crawler will only ever process the initial URL 

  async crawl(startUrl: string, company:string): Promise<Page[]> {
    // Add the start URL to the queue
    this.addToQueue(startUrl);
    // this: Refers to the current instance of the class. When you create a new object from a class, this is used inside methods to access properties and other methods of that object.

    // While there are URLs in the queue and we haven't reached the maximum number of pages...
    while (this.shouldContinueCrawling()) {
      // Dequeue the next URL and depth
      const { url, depth } = this.queue.shift()!;
      // .shift(): Another array method that removes the first element from an array and returns it. This is commonly used in queue implementations. In your crawler, this.queue.shift() is taking the next URL to visit from the queue.

      // If the depth is too great or we've already seen this URL, skip it
      if (this.isTooDeep(depth) || this.isAlreadySeen(url)) continue;

      // Add the URL to the set of seen URLs
      this.seen.add(url);

      // Fetch the page HTML
      const html = await this.fetchPage(url);

      // Parse the HTML and add the page to the list of crawled pages
      this.pages.push({ 
        url, 
        content: this.parseHtml(html),
        company 
      }); 
      // .push(): This is an array method in JavaScript. It adds a new element to the end of an array. In the context of your crawler, this.pages.push() is adding a new Page object to the this.pages array.

      // Extract new URLs from the page HTML and add them to the queue
      this.addNewUrlsToQueue(this.extractUrls(html, url), depth);
    }

    // Return the list of crawled pages
    return this.pages;
  }

  private async fetchPage(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (url.endsWith('.pdf')) {
        const buffer = await response.arrayBuffer();
        const parseResponse = await fetch('/api/crawl/parse-pdf', {
          method: 'POST',
          body: buffer,
        });
        const parsedData = await parseResponse.json();
        return parsedData.text;
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error(`Failed to fetch ${url}: ${error}`);
      return '';
    }
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
