const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const morgan = require('morgan');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({extended: false});
const ObjectId = require('mongodb').ObjectID;

MongoClient.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');

const app = express();

// Logging
app.use(morgan('common'));

// CORS
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    if (req.method === 'OPTIONS') {
        return res.send(204);
    }
    next();
});

const home = require('./titles/index');

app.use(express.static('public'));

let server;

var dbase;

function runServer(databaseUrl = DATABASE_URL, port = PORT) {
    return new Promise((resolve, reject) => {

        MongoClient.connect(databaseUrl, (err, client) => {
            if (err) {
                return reject(err);
            }

            // get all titles from server
            app.get('/api/all-titles', (req, res) => {
                dbase = client.db('dev-challenge');
                return dbase
                    .collection('Titles')
                    .find()
                    .toArray(function (err, result) {
                        if (err) 
                            throw err
                        res.send(result);
                    })
            });

            // get titles that match or partially match search query
            app.get('/api/titles/:titleName', (req, res) => {
                dbase = client.db('dev-challenge');

                let title = `${req.params.titleName}`;
                return dbase
                    .collection('Titles')
                    .find({
                        TitleName: {
                            $regex: title,
                            '$options': 'ix'
                        }
                    })
                    .project({TitleName: 1})
                    .toArray(function (err, result) {
                        if (err) 
                            throw err
                        res.send(result);
                    })
            });

            // get titles that match or partially match search query
            app.get('/api/titlesById/:id', (req, res) => {
                dbase = client.db('dev-challenge');
                let id = `${req.params.id}`;
                return dbase
                    .collection('Titles')
                    .find({"_id": id})
                    .toArray(function (err, result) {
                        if (err) 
                            throw err
                        res.send(result);
                    })
            });

            server = app.listen(port, () => {
                console.log(`Turner Titles App is listening on port ${port}`);
                resolve();
            }).on('error', err => {
                MongoClient.disconnect();
                reject(err);
            });
        });
    });
}

function closeServer() {
    return MongoClient
        .disconnect()
        .then(() => {
            return new Promise((resolve, reject) => {
                console.log('Closing Server');
                server.close(err => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        });
}

if (require.main === module) {
    runServer().catch(err => console.error(err));
};

module.exports = {
    app,
    runServer,
    closeServer
};