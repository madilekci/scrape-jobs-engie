import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import * as cheerio from 'cheerio';

import Job from './Job.js';

// helpers
import { writeJobLinks, readJobLinks } from './get-job-links.js';
import { createStealthBrowserPage, scrollToBottom, trimExtraSpaces } from './helpers/puppeteer-helpers.js';
import getArgs from './helpers/get-args.js';
import writeFile from './helpers/write-file.js';

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
        __dirname + '/results/jobs.csv'
    );
    await job.saveAsCSV();

    return parsedData;
}


let { url, startPage, endPage, createJobLinks } = getArgs();

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


        if (createJobLinks) {
            await writeJobLinks(__dirname + '/results/job_links.json', page, url, startPage, endPage)
        }

        const jobLinks = await readJobLinks(__dirname + '/results/job_links.json');

         console.log('--------------------------------------------------------');
         console.log('Collected job links successfully');
         console.log('--------------------------------------------------------');

         await scrapeJobPages(page, jobLinks);

         browser.close();
        })();
     }
     catch (error) {
         console.log(error);
     }
}
