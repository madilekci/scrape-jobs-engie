import puppeteerExtra from 'puppeteer-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteerExtra.use(stealthPlugin());

export const createStealthBrowserPage = async() => {
    const browser = await puppeteerExtra.launch({
        headless: true,
        args: [
            '--no-sandbox',
            // '--disable-setuid-sandbox',
            // '--window-position=0,0',
        ],
    });

    const page = await browser.newPage();

    // const preloadFile = fs.readFileSync(`${mainDirName}/scrape/preload.js`, 'utf8');
    // await page.evaluateOnNewDocument(preloadFile);

    await page.setViewport({
        width: 1920,
        height: 1080
    });

    return [browser, page];
}
export const scrollToBottom = async(page, distance = 100, delay = 100) => {
    while (await page.evaluate(() => document.scrollingElement.scrollTop + window.innerHeight < document.scrollingElement.scrollHeight)) {
        await page.evaluate(y => {
            document.scrollingElement.scrollBy(0, y);
        }, distance);
        await page.waitForTimeout(delay);
    }
}
export const trimExtraSpaces = (str) => {
    return str.replace(/\n/g, '').replace(/\s+/g, ' ')
        .trim();
}