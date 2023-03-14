import readFile from './helpers/read-file.js';
import writeFile from './helpers/write-file.js';
import * as cheerio from 'cheerio';

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

export const writeJobLinks = async(jobLinksFilename, page, link, startPage = 1, endPage = 3) => {
    const jobLinks = await getJobLinks(page, link, startPage, endPage);
    await writeFile(jobLinksFilename, await JSON.stringify(jobLinks));
}

export const readJobLinks = async(jobLinksFilename) => {
    const fileContent = await readFile(jobLinksFilename);
    if (fileContent === null) {
        throw Error('Could not read job links');
    }

    const jobLinks = await JSON.parse(fileContent)
    return jobLinks;
}
