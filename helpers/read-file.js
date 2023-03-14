import fs from 'fs';
const readFile = (filename) => {
    let data = null;
    try {
        data = fs.readFileSync(filename, 'utf-8');
        console.log(`The file ${filename} readed successfully.`);
    } catch (error) {
        console.log(error);
    }

    return data;
}

export default readFile;