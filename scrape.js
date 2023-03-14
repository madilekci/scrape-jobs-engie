import scrapeJobPages from './get-job-details.js';
import { writeJobLinks, readJobLinks } from './get-job-links.js';

// helpers
import {
	createStealthBrowserPage,
} from './helpers/puppeteer-helpers.js';
import getArgs from './helpers/get-args.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RESULTS_FOLDER = __dirname + '/results/';

let { url, startPage, endPage, createJobLinks } = getArgs();

startPage = Number(startPage);
endPage = Number(endPage);

if (typeof url === 'string' && url !== '' && startPage > 0 && endPage > 0) {
	try {
		(async () => {
			// create browser and page
			const [browser, page] = await createStealthBrowserPage();

			if (createJobLinks) {
				await writeJobLinks(
					RESULTS_FOLDER + 'job_links.json',
					page,
					url,
					startPage,
					endPage
				);
			}

			const jobLinks = await readJobLinks( RESULTS_FOLDER + 'job_links.json');

			console.log('--------------------------------------------------------');
			console.log('Collected job links successfully');
			console.log('--------------------------------------------------------');

			await scrapeJobPages(RESULTS_FOLDER , page, jobLinks);

			browser.close();
		})();
	} catch (error) {
		console.log(error);
	}
} else {
	console.log(' you must specify a search page url, start page, end page');
}
