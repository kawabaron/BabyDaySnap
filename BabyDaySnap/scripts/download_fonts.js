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
    download("https://github.com/googlefonts/zen-kurenaido/raw/main/fonts/ttf/ZenKurenaido-Regular.ttf", "assets/fonts/ZenKurenaido-Regular.ttf"),
    download("https://github.com/Kinutafontfactory/Yuji/raw/master/fonts/ttf/YujiSyuku-Regular.ttf", "assets/fonts/YujiSyuku-Regular.ttf"),
    download("https://github.com/nagamaki008/NewTegomin/raw/master/fonts/ttf/NewTegomin-Regular.ttf", "assets/fonts/NewTegomin-Regular.ttf"),
    download("https://github.com/google/fonts/raw/main/ofl/mplusrounded1c/MPLUSRounded1c-Bold.ttf", "assets/fonts/MPLUSRounded1c-Bold.ttf"),
    download("https://github.com/fontworks-fonts/Train/raw/master/fonts/ttf/TrainOne-Regular.ttf", "assets/fonts/TrainOne-Regular.ttf"),
    download("https://github.com/fontworks-fonts/Klee/raw/master/fonts/ttf/KleeOne-SemiBold.ttf", "assets/fonts/KleeOne-SemiBold.ttf")
]).then(() => {
    console.log("Fonts downloaded successfully");
}).catch((e) => {
    console.error("Failed to download fonts", e);
});
