const fs = require("fs");
const https = require("https");

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return download(res.headers.location, dest).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error("Failed with " + res.statusCode));
            }
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on("finish", () => {
                file.close(resolve);
            });
        }).on("error", reject);
    });
};

Promise.all([
    download("https://github.com/googlefonts/zen-marugothic/raw/main/fonts/ttf/ZenMaruGothic-Bold.ttf", "assets/fonts/ZenMaruGothic-Bold.ttf"),
    download("https://github.com/googlefonts/zen-kurenaido/raw/main/fonts/ttf/ZenKurenaido-Regular.ttf", "assets/fonts/ZenKurenaido-Regular.ttf")
]).then(() => {
    console.log("Fonts downloaded successfully");
}).catch((e) => {
    console.error("Failed to download fonts", e);
});
