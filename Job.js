import fs from 'fs';

class Job {
    constructor(
        entityName = '',
        jobExternalId='',
        jobPostingDate='',
        jobTitle ='',
        jobDescription ='',
        csvFilePath,
    ) {
      this.entityName = entityName;
      this.jobExternalId = jobExternalId;
      this.jobPostingDate = jobPostingDate;
      this.jobTitle = jobTitle;
      this.jobDescription = jobDescription;
      this.csvFilePath = csvFilePath;
    }

    saveAsCSV() {
        const csv = `${this.entityName},${this.jobExternalId},${this.jobPostingDate},${this.jobTitle},${this.jobDescription},\n`;
        try {
            fs.appendFileSync(this.csvFilePath, csv);
        } catch (err) {
          console.error(err);
        }
      }
}

export default Job;