import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import puppeteerExtra from 'puppeteer-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteerExtra.use(stealthPlugin());
import * as cheerio from 'cheerio';

// write file creates a new file if file doesn't exists.
// clears the file, then puts the "data" in it if file exists.
function writeFile(filename, data){
    console.log('filename', filename);
    fs.writeFile(filename, data, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file is saved!");
    });
}
const createStealthBrowserPage = async() => {
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
const scrollToBottom = async(page, distance = 100, delay = 100) => {
    while (await page.evaluate(() => document.scrollingElement.scrollTop + window.innerHeight < document.scrollingElement.scrollHeight)) {
        await page.evaluate(y => {
            document.scrollingElement.scrollBy(0, y);
        }, distance);
        await page.waitForTimeout(delay);
    }
}
const trimExtraSpaces = (str) => {
    return str.replace(/\n/g, '').replace(/\s+/g, ' ')
        .trim();
}


// get html of a job page from link
const scrapeJobPages = async(page, links) => {

    for (let index = 0; index < links.length; index++) {
        const link = links[index];
        console.log(`going to job page ${index}`);
        await page.goto(link);

        // wait until page loaded
        console.log('waiting for job page to load');
        await page.waitForSelector('#jJobInsideInfo');

        console.log('scroll to bottom');
        await scrollToBottom(page);

        const data = await page.evaluate(() => document.querySelector('*').innerHTML);

        const scrapedData = await processJobPageHtml(data);
        console.log('Creating .html file');
        writeFile(__dirname + '/results/' + scrapedData.fileName, scrapedData.fileContent);
    }

    return true;
}
const processJobPageHtml = async (pageHtml) => {
    console.log('processing the job html');
    //
    const $ = cheerio.load(pageHtml);

    const entityName = trimExtraSpaces($('.info_box .info_box_fields .field_company .field_value').text());
    const jobTitle = trimExtraSpaces($('.content_header h1').text());
    const jobExternalId = trimExtraSpaces($('.info_box .info_box_fields .pref_field .job_external_id .field_value').text());
    const jobPostingDate = trimExtraSpaces($('#jJobInsideInfo ul #65').text().slice($('#jJobInsideInfo ul li label').text().indexOf(': ') + 1));
    const fileName = `${entityName}_${jobExternalId}_${jobPostingDate}.html`;
    const fileContent = $('#job_details_content').html();
    const jobDescription = trimExtraSpaces($('.description_box .job_description').text());

    const parsedData = {
        entityName,
        jobTitle,
        jobExternalId,
        jobPostingDate,
        jobDescription,
        fileName,
        fileContent
    }

    return parsedData;
}

const getJobLinks = async (page, link, pageCount) => {
    // For every page
    const jobLinks = [];
    for (let index = 1; index < pageCount; index++) {
        const searchPageLink = link + `/page${index}`;
        console.log(`go to search page ${index}`);
        await page.goto(searchPageLink);
        const searchPageHTML = await page.evaluate(() => document.querySelector('*').outerHTML);
        const searchResults = await processSearchResults(searchPageHTML);
        jobLinks.push(...searchResults);
    }

    return jobLinks;
}

// process skillsPage, find every skill , put them in an array and save to db
const processSearchResults = async(data) => {
    console.log('process search results to find job page urls...');
    const $ = cheerio.load(data);

    const jobsList = [];
    const jobsCard = $('#job_results_list_hldr');

    jobsCard.find('.job_list_row .jlr_right_hldr .jlr_title p a').each((index, element) => {
        jobsList.push($(element).attr().href);
    });

    return jobsList;
}


const searchPageURL = 'https://jobs.engie.com/jobs/search/93224167';
const startPage = 1;
const endPage = 3;
try {
   (async() => {
     // create browser and page
    const [browser, page] = await createStealthBrowserPage();

    const links = await getJobLinks(page, searchPageURL, startPage, endPage);

    console.log('--------------------------------------------------------');
    console.log('Collected job links successfully');
    console.log('--------------------------------------------------------');

    await scrapeJobPages(page, links);

    browser.close();
   })();
}
catch (error) {
    console.log(error);
}