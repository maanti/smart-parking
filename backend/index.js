const http = require("http");
const DataStore = require("nedb");
const PORT = 8080;

let DB;

function requestHandler(req, res) {
    if (req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString(); // convert Buffer to string
        });
        req.on("end", () => {
            console.log(body);
            const {parking_id, busy} = JSON.parse(body);
            DB.update({parking_id}, {parking_id, busy}, {upsert: true});
            res.end("ok");
        });
    }
    if (req.method === "GET") {
        DB.find({}, (err, docs) => {
            res.writeHead(200, {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"});
            let preparedObj = docs.map((obj) => {
                const {parking_id, busy} = obj;
                return {parking_id, busy};
            });
            preparedObj.sort((a, b) => {
                return a.parking_id - b.parking_id;
            });
            console.log(JSON.stringify(preparedObj));
            res.write(JSON.stringify(preparedObj));
            res.end();
        });
    }
}

function generateCars() {
    for (let i = 0; i < 10; i++) {
        DB.update({parking_id: i}, {parking_id: i, busy: Math.round(Math.random())}, {upsert: true});
    }
}

function start() {
    const server = http.createServer(requestHandler);
    DB = new DataStore({ filename: `${__dirname}/data/parkingPlaces` });
    DB.loadDatabase();
    server.listen(PORT, (err) => {
        if (err) {
            return console.log("something bad happened", err);
        }
        console.log(`server is listening on ${PORT}`);
    });

    generateCars();
    setInterval(() => {
        generateCars();
    }, 10000);
}

start();
