const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const parseEnv = () => {
    let env = fs.readFileSync('.env', 'utf8').split('\n');
    let config = {};
    env.forEach(line => {
        if(line.includes('=')) {
            let parts = line.split('=');
            config[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
    return config;
}
const e = parseEnv();

cloudinary.config({
    cloud_name: 'de1rf5pi8',  // Trying the frontend's cloud name!
    api_key: e.CLOUDINARY_API_KEY,
    api_secret: e.CLOUDINARY_API_SECRET
});

cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', {
    folder: 'kk_traders',
    resource_type: 'auto'
}, (error, result) => {
    if (error) {
        console.error('ERROR:', error);
    } else {
        console.log('SUCCESS:', result.secure_url);
    }
});
