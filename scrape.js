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
    fs.writeFile(filename, data, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log(`The file ${filename} created successfully.`);
    });
}
// Get arguments from command line and format them into a simple object
// node index.js -D --var='Hey' --> {D: true, var: 'Hey'}
const getArgs = () => {
    const args = {};
    process.argv
        .slice(2, process.argv.length)
        .forEach( arg => {
        // long arg
        if (arg.slice(0,2) === '--') {
            const longArg = arg.split('=');
            const longArgFlag = longArg[0].slice(2,longArg[0].length);
            const longArgValue = longArg.length > 1 ? longArg[1] : true;
            args[longArgFlag] = longArgValue;
        }
        // flags
        else if (arg[0] === '-') {
            const flags = arg.slice(1,arg.length).split('');
            flags.forEach(flag => {
            args[flag] = true;
            });
        }
    });
    return args;
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


// get html of a job page from jobLinks and parse it, create related html file
const scrapeJobPages = async(page, links) => {

    for (let index = 0; index < links.length; index++) {
        const link = links[index];
        console.log(`going to job page ${index+1}`);
        try {
            await page.goto(link);

            // wait until page loaded
            await page.waitForSelector('#jJobInsideInfo');

            await scrollToBottom(page);

            const data = await page.evaluate(() => document.querySelector('*').innerHTML);

            const scrapedData = await processJobPageHtml(data);
            writeFile(__dirname + '/results/' + scrapedData.fileName, scrapedData.fileContent);

            ( index > 1 ) && ( index % 100 === 0 ) && console.log('100 jobs scraped successfully.');
        } catch (error) {
            console.log('--------------------------------------------------------');
            console.log(`error in page ${index}`);
            console.log(error);
            console.log(link);
            console.log('--------------------------------------------------------');
        }
    }

    return true;
}
const processJobPageHtml = async (pageHtml) => {
    console.log('processing the job html');
    const $ = cheerio.load(pageHtml);

    const entityName = trimExtraSpaces($('.info_box .info_box_fields .field_company .field_value').text());
    const jobTitle = trimExtraSpaces($('.content_header h1').text());
    const jobExternalId = trimExtraSpaces($('.info_box .info_box_fields .pref_field .job_external_id .field_value').text());
    const jobPostingDate = trimExtraSpaces($('#jJobInsideInfo ul #65').text().slice($('#jJobInsideInfo ul li label').text().indexOf(': ') + 1));
    const fileName = `${entityName}_${jobExternalId}_${jobPostingDate}.html`;
    const fileContent = $('#job_details_content').html();
    const jobDescription = trimExtraSpaces($('.job_description').text());

    const parsedData = {
        entityName,
        jobTitle,
        jobExternalId,
        jobPostingDate,
        jobDescription,
        fileName,
        fileContent
    }

    const job = new Job(
        entityName,
        jobExternalId,
        jobPostingDate,
        jobTitle,
        jobDescription,
    );
    await job.saveAsCSV();

    return parsedData;
}

// get job links from each page of the search results
const getJobLinks = async (page, link, startPage, endPage) => {
    // For every page
    const jobLinks = [];
    for (let index = startPage; index < endPage; index++) {
        const searchPageLink = link + `/page${index}`;
        console.log(`go to search page ${index}`);
        await page.goto(searchPageLink);
        const searchPageHTML = await page.evaluate(() => document.querySelector('*').outerHTML);
        const searchResults = await processSearchResults(searchPageHTML);
        jobLinks.push(...searchResults);
    }

    return jobLinks;
}
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

class Job {
    constructor(entityName = '', jobExternalId='', jobPostingDate='', jobTitle ='', jobDescription ='' ) {
      this.entityName = entityName;
      this.jobExternalId = jobExternalId;
      this.jobPostingDate = jobPostingDate;
      this.jobTitle = jobTitle;
      this.jobDescription = jobDescription;
    }

    saveAsCSV() {
        const csv = `${this.entityName},${this.jobExternalId},${this.jobPostingDate},${this.jobTitle},${this.jobDescription},\n`;
        try {
            fs.appendFileSync(__dirname + '/results/jobs.csv', csv);
        } catch (err) {
          console.error(err);
        }
      }
}


const args = getArgs();
let { url, startPage, endPage } = args

startPage = Number(startPage);
endPage = Number(endPage);

// const url = 'https://jobs.engie.com/jobs/search/93224167';
// const startPage = 1;
// const endPage = 2;

if ( typeof url != 'string' || !(url.length > 0) || !(startPage > 0) || !(endPage > 0) ) {
    console.log(' you must specify a search page url, start page, end page');

}
else {
    try {
        (async() => {
          // create browser and page
         const [browser, page] = await createStealthBrowserPage();

         const links = await getJobLinks(page, url, startPage, endPage);

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
}
