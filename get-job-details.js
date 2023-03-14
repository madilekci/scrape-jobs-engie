import Job from './Job.js';
import * as cheerio from 'cheerio';

// helpers
import writeFile from './helpers/write-file.js';
import {
	scrollToBottom,
	trimExtraSpaces,
} from './helpers/puppeteer-helpers.js';

// get html of a job page from jobLinks and parse it, create related html file
const scrapeJobPages = async (resultsFolder, page, links) => {
	for (let index = 0; index < links.length; index++) {
		const link = links[index];
		console.log(`going to job page ${index + 1}`);
		try {
			await page.goto(link);

			// wait until page loaded
			await page.waitForSelector('#jJobInsideInfo');

			await scrollToBottom(page);

			const data = await page.evaluate(() => document.querySelector('*').innerHTML);

			const scrapedData = await processJobPageHtml(data, resultsFolder);
			writeFile(resultsFolder + scrapedData.fileName, scrapedData.fileContent);
		} catch (error) {
			console.log('--------------------------------------------------------');
			console.log(`error in page ${index}`);
			console.log(error);
			console.log(link);
			console.log('--------------------------------------------------------');
		}
	}

	return true;
};

const processJobPageHtml = async (pageHtml, resultsFolder) => {
	console.log('processing the job html');
	const $ = cheerio.load(pageHtml);

	const entityName = trimExtraSpaces(
		$('.info_box .info_box_fields .field_company .field_value').text()
	);
	const jobTitle = trimExtraSpaces($('.content_header h1').text());
	const jobExternalId = trimExtraSpaces(
		$('.info_box .info_box_fields .pref_field .job_external_id .field_value').text()
	);
	const jobPostingDate = trimExtraSpaces(
		$('#jJobInsideInfo ul #65')
			.text()
			.slice($('#jJobInsideInfo ul li label').text().indexOf(': ') + 1)
	);
	const fileName = `${entityName}_${jobExternalId}_${jobPostingDate}.html`;
	const fileContent = $('#job_details_content').html();
	const jobDescription = trimExtraSpaces($('.job_description').text());

	const parsedData = {
		entityName,
		jobExternalId,
		jobPostingDate,
		jobTitle,
		jobDescription,
		fileName,
		fileContent,
	};

	const job = new Job(
		entityName,
		jobExternalId,
		jobPostingDate,
		jobTitle,
		jobDescription,
		resultsFolder + 'jobs.csv'
	);
	await job.saveAsCSV();

	return parsedData;
};

export default scrapeJobPages;