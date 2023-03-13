echo "Installing dependencies"
npm i
echo "----------------------------------------------------------------"
node scrape.js --url='https://jobs.engie.com/jobs/search/93224167' --startPage=1 --endPage=3