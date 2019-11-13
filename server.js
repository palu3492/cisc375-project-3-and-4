// Built-in Node.js modules
// var fs = require('fs');
let path = require('path');
let bodyParser = require('body-parser');
let xmlConverter = require('xml-js');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


//let public_dir = path.join(__dirname, 'public');
let db_filename = path.join(__dirname, 'database', 'stpaul_crime.sqlite3');

let app = express();
app.use(bodyParser.urlencoded({extended: true}));
let port = 8000;

// open usenergy.sqlite3 database
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    } else {
        console.log('Now connected to ' + db_filename);
        //testSql();
    }
});

// SQL query testing function
function testSql(){
    // incidents
    db.all("SELECT * FROM Incidents", (err, rows) => {
        let caseNumber, dateTime, date, time, json;
        let incidents = {};
        rows.forEach(row => {
            caseNumber = row['case_number'];
            dateTime = row['date_time'];
            [date, time] = dateTime.split('T');
            incidents[caseNumber] = {
                'date': date,
                'time': time,
                'code': row['code'],
                'incident': row['incident'],
                'police_grid': row['police_grid'],
                'neighborhood_number': row['neighborhood_number'],
                'block': row['block'],
            };
        });
        json = JSON.stringify(incidents);
    });
}

// GET /codes
// Return JSON object with list of codes and their corresponding incident type (ordered by code)
// ?code=110,700, default all codes
// ?format=xml, default json
app.get('/codes', (req, res) => {
    let format = req.query.format;
    let sql = 'SELECT * FROM Codes';
    let code = req.query.code;
    if(code){ // check if code was supplied
        let codes = code.split(',');
        sql += ' WHERE code = ' + codes.join(' OR code = ');
    }
    sql += ' ORDER BY code ASC';
    console.log(sql);
    // with code param = SELECT * FROM Codes WHERE code = 110 OR code = 313 OR code = 941 ORDER BY code ASC
    // with NO code param = SELECT * FROM Codes ORDER BY code ASC
    db.all(sql, (err, rows) => {
        let code, incidentType, response;
        let codes = {};
        rows.forEach(row => {
            code = row['code'];
            incidentType = row['incident_type'];
            codes[code] = incidentType;
        });
        if(format === 'XML'){
            response = xmlConverter.js2xml(codes, {compact: false, spaces: 4});
            res.writeHead(200, {'Content-Type': 'application/xml'});
        } else {
            response = JSON.stringify(codes);
            res.writeHead(200, {'Content-Type': 'application/json'});
        }
        res.write(response);
        res.end();
    });
});

// GET /neighborhoods
// Return JSON object with list of neighborhood ids and their corresponding neighborhood name (ordered by neighborhood number)
app.get('/neighborhoods', (req, res) => {
    // default limit 10,000
    db.all("SELECT * FROM Neighborhoods ORDER BY neighborhood_number ASC", (err, rows) => {
        let neighborhoodNumber, neighborhoodName, json;
        let neighborhoods = {};
        rows.forEach(row => {
            neighborhoodNumber = row['neighborhood_number'];
            neighborhoodName = row['neighborhood_name'];
            neighborhoods[neighborhoodNumber] = neighborhoodName;
        });
        json = JSON.stringify(neighborhoods);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(json);
        res.end();
    });
});

// GET /incidents
// Return JSON object with list of crime incidents (most recent first). Make date and time separate fields.
app.get('/incidents', (req, res) => {
    db.all("SELECT * FROM Incidents ORDER BY date_time DESC", (err, rows) => {
        let caseNumber, dateTime, date, time, json;
        let incidents = {};
        // The rows are ordered correctly by time but when putting them into object it won't order them correctly even after using rows.reverse()
        rows.forEach(row => {
            caseNumber = row['case_number'];
            dateTime = row['date_time'];
            [date, time] = dateTime.split('T');
            incidents[caseNumber] = {
                'date': date,
                'time': time,
                'code': row['code'],
                'incident': row['incident'],
                'police_grid': row['police_grid'],
                'neighborhood_number': row['neighborhood_number'],
                'block': row['block'],
            };
        });
        json = JSON.stringify(incidents);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(json);
        res.end();
    });
});

// PUT /new-incident
// Upload incident data to be inserted into the SQLite3 database
app.put('/new-incident', (req, res) => {

    let caseNumber = '11'; // real one: 12234314
    db.get("SELECT case_number FROM Incidents WHERE case_number = ?", caseNumber, (err, row) => {
        // if row is undefined then case number does not exist
        if(row){

        }
    });
    // let values = ['0000', '2015-10-29T07:46:00', 2, '1', 2, 3, '1'];
    // console.log(req.body);
    // // check if in db first using a SELECT then send 500 error if exists else continue
    // // Getting error saying database is readonly
    // db.run("INSERT INTO Incidents VALUES (?, ?, ?, ?, ?, ?, ?)", values, (err, rows) => {
    //     console.log(err);
    //     console.log(rows);
    // });
    // // json = JSON.stringify(incidents);
    // // res.writeHead(200, {'Content-Type': 'application/json'});
    // // res.write(json);
    // // res.end();

});

/*
PUT /new-incident
Upload incident data to be inserted into the SQLite3 database
Data fields:
case_number
date
time
code
incident
police_grid
neighborhood_number
block
Note: response should reject (status 500) if the case number already exists in the database


Incidents:
case_number (TEXT): unique id from crime case
date_time (DATETIME): date and time when incident took place
code (INTEGER): crime incident type numeric code
incident (TEXT): crime incident description (more specific than incident_type)
police_grid (INTEGER): police grid number where incident occurred
neighborhood_number (INTEGER): neighborhood id where incident occurred
block (TEXT): approximate address where incident occurred
*/

console.log('Listening on port ' + port);
let server = app.listen(port);