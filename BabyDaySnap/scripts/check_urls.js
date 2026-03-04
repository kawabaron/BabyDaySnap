const https = require("https");

const checkUrl = (url) => {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            console.log(url, res.statusCode);
            resolve();
        });
    });
};

const urls = [
    "https://github.com/googlefonts/zen-kurenaido/raw/main/fonts/ttf/ZenKurenaido-Regular.ttf",
    "https://github.com/googlefonts/kaisei-decol/raw/main/fonts/ttf/KaiseiDecol-Regular.ttf"
];

Promise.all(urls.map(checkUrl)).then(() => console.log("Done checking URLs"));
