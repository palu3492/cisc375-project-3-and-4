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
        testSql();
    }
});

function testSql(){
    db.all("SELECT * FROM Codes ORDER BY code ASC", (err, rows) => {
        let code, incidentType, json;
        let codes = {};
        rows.forEach(row => {
            code = row['code'];
            incidentType = row['incident_type'];
            codes[code] = incidentType;
        });
        json = JSON.stringify(codes);
        /*
        [
            { code: 603, incident_type: 'Theft - Mail/Package' },
            { code: 603, incident_type: 'Theft - Mail/Package' },
            { code: 603, incident_type: 'Theft - Mail/Package' }
        ]
        */
    });
}

// GET /codes
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


console.log('Listening on port ' + port);
let server = app.listen(port);
/*
GET /codes
Return JSON object with list of codes and their corresponding incident type (ordered by code)
{
  "110": "Murder, Non Negligent Manslaughter",
  "120": "Murder, Manslaughter By Negligence",
  "210": "Rape, By Force"
}


GET /neighborhoods
Return JSON object with list of neighborhood ids and their corresponding neighborhood name (ordered by neighborhood number)
{
  "1": "Conway/Battlecreek/Highwood",
  "2": "Greater East Side",
  "3": "West Side",
  "4": "Dayton's Bluff"
}


GET /incidents
Return JSON object with list of crime incidents (most recent first). Make date and time separate fields.
Example:
{
  "19245020": {
    "date": "2019-10-30",
    "time": "23:57:08",
    "code": 9954,
    "incident": "Proactive Police Visit",
    "police_grid": 87,
    "neighborhood_number": 7,
    "block": "THOMAS AV  & VICTORIA"
  },
  ...
}

*/