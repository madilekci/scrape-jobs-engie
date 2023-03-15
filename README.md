# Scrape Jobs Engie

Scrape Jobs Engie is a web scraping and automation project that allows you to crawl all job listings from "https://jobs.engie.com" with ease. The project uses Node.js, Puppeteer, Puppeteer-Extra, and Puppeteer-Stealth-Plugin to create a script that automates the process of browsing through job listings, collecting job data, and exporting it to various files.

## Project Overview

When you run the script, it will perform the following steps:

1. Go to the Engie jobs website.
2. Enter search criteria.
3. Browse through search results and collect URLs of all job listings.
4. Visit each job listing and collect job data.
5. Create an HTML file for each job detail under the /results folder.
6. Export all job data into a jobs.csv file.

## Installation

Follow these steps to install and run the project:

1. Download the source code or clone the repository.
2. Open a terminal in the project root directory.
3. Run `npm install` to install all dependencies.

## Usage

To run the script, use the following command in the terminal:

```bash
node scrape.js --url='https://jobs.engie.com/jobs/search/93224167' --startPage=1 --endPage=3
```
You can modify the following parameters:

--url: The URL to start scraping from.  
--startPage: The page number to start scraping from.  
--endPage: The page number to end scraping on.  

Once you run the script, it will start scraping and collecting job data.
The collected data will be saved to the /results folder, with each job detail having its own HTML file and all job data in a single Excel file.

