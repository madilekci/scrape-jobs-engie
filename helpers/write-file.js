import fs from 'fs';
// write file creates a new file if file doesn't exists.
// clears the file, then puts the "data" in it if file exists.
const writeFile = (filename, data) => {
    fs.writeFileSync(filename, data, function(err) {
        if(err) {
            console.log(err);
            return;
        }
        console.log(`The file ${filename} created successfully.`);
    });
}

export default writeFile;