//{
// "dependencies": {
//     "axios": "^0.18.0",
//     "form-data": "3.0.0",
//     "memory-fs": "0.5.0"
//   }
//}

const axios = require("axios");
const FormData = require('form-data');
const MemoryFileSystem = require("memory-fs");

module.exports = { main: async function (event, context) {

    //generate a file...
    const fsMem = new MemoryFileSystem()
    fsMem.mkdirpSync("/temp");
    fsMem.writeFileSync("/temp/file.txt", "Hello World");
    var myfile = fsMem.readFileSync("/temp/file.txt");

    const formData = new FormData();
    formData.append('directory', 'example-lambda');
    formData.append('public', myfile, {
        contentType: 'text/plain',
        filename: 'file.txt',
    });
    
    console.log("----Sending----");
    try{
        const resp = await axios.post('http://rafter-upload-service.kyma-system.svc.cluster.local/v1/upload', formData, { headers: formData.getHeaders() });
        return JSON.stringify(resp.data);
    }catch(err){
        console.error('Failure!');
        console.error(err.response);
    }

}}
