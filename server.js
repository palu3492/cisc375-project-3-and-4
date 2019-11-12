// Built-in Node.js modules
// var fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


//let public_dir = path.join(__dirname, 'public');
let db_filename = path.join(__dirname, 'database', 'stpaul_crime.sqlite3');

let app = express();
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
app.get('/codes', (req, res) => {
    db.all("SELECT * FROM Codes ORDER BY code ASC", (err, rows) => {
        let code, incidentType, json;
        let codes = {};
        rows.forEach(row => {
            code = row['code'];
            incidentType = row['incident_type'];
            codes[code] = incidentType;
        });
        json = JSON.stringify(codes);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(json);
        res.end();
    });
});

// GET /neighborhoods
// Return JSON object with list of neighborhood ids and their corresponding neighborhood name (ordered by neighborhood number)
app.get('/neighborhoods', (req, res) => {
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
    db.all("SELECT * FROM Incidents ORDER BY date_time DESC LIMIT 2", (err, rows) => {
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


console.log('Listening on port ' + port);
let server = app.listen(port);