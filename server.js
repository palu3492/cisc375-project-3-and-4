// Built-in Node.js modules
// var fs = require('fs');
let path = require('path');
let bodyParser = require('body-parser'); // For parsing params in requests
let xmlConverter = require('xml-js'); // For converting JS objects to XML

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
    let formatParam = req.query.format;
    let codeParam = req.query.code;

    let sqlQuery = buildSqlQueryForCodes(codeParam);
    writeResponse(res, sqlQuery, getCodesObjectFromRows, formatParam);
});

function buildSqlQueryForCodes(codeParam){
    let sql, codes;
    // Build SQL query using optional 'code' URL param
    sql = 'SELECT * FROM Codes';
    if(codeParam){ // if 'code' URL param was supplied
        codes = codeParam.split(',');
        sql += ' WHERE code = ' + codes.join(' OR code = ');
    }
    sql += ' ORDER BY code ASC';
    return sql;
}

function getCodesObjectFromRows(rows){
    let code, incidentType;
    let codes = {};
    // Maps code to incident type in an object
    rows.forEach(row => {
        code = row['code'];
        incidentType = row['incident_type'];
        codes['C'+code] = incidentType;
    });
    return codes;
}



// GET /neighborhoods
// Return JSON object with list of neighborhood ids and their corresponding neighborhood name (ordered by neighborhood number)
app.get('/neighborhoods', (req, res) => {
    let formatParam = req.query.format;
    let idParam = req.query.id;

    let sqlQuery = buildSqlQueryForNeighborhoods(idParam);
    writeResponse(res, sqlQuery, getNeighborhoodsObjectFromRows, formatParam);
});

function buildSqlQueryForNeighborhoods(idParam){
    let sql, ids;
    // Build SQL query using optional 'id' URL param
    sql = 'SELECT * FROM Neighborhoods';
    if(idParam){ // if 'id' URL param was supplied
        ids = idParam.split(',');
        sql += ' WHERE neighborhood_number = ' + ids.join(' OR neighborhood_number = ');
    }
    sql += ' ORDER BY neighborhood_number ASC';
    return sql;
}

function getNeighborhoodsObjectFromRows(rows){
    let neighborhoodNumber, neighborhoodName;
    let neighborhoods = {};
    rows.forEach(row => {
        neighborhoodNumber = row['neighborhood_number'];
        neighborhoodName = row['neighborhood_name'];
        neighborhoods['N'+neighborhoodNumber] = neighborhoodName;
    });
    return neighborhoods;
}

// GET /incidents
// Return JSON object with list of crime incidents (most recent first). Make date and time separate fields.
app.get('/incidents', (req, res) => {
    let formatParam = req.query.format;
    let params = req.query;

    let sqlQuery = buildSqlQueryForIncidents(params);
    writeResponse(res, sqlQuery, getIncidentsObjectFromRows, formatParam);
});

function buildSqlQueryForIncidents(params){
    let sql, ids;
    // Build SQL query using all optional URL params
    sql = 'SELECT * FROM Incidents';
	// loop through params and use them in where if they're in this array
	let possibleParams = ['start_date', 'end_date', 'code', 'grid', 'neighborhood', 'limit'];
	// this is an object! can't loop like array
	params.forEach(param => {
		if(param in possibleParams){
			sql += ' WHERE ' + param + ' = ' + ids.join(' OR neighborhood_number = '); // not done
		}
	});
    // if(idParam){ // if 'id' URL param was supplied
    //     ids = idParam.split(',');
    //     sql += ' WHERE neighborhood_number = ' + ids.join(' OR neighborhood_number = ');
    // }
    sql += ' ORDER BY date_time DESC LIMIT 10'; // default 10,000
    return sql;
}
/*
start_date - first date to include in results (e.g. ?start_date=09-01-2019)
end_date - last date to include in results (e.g. ?end_date=10-31-2019)
code - comma separated list of codes to include in result (e.g. ?code=110,700). By default all codes
should be included.
grid - comma separated list of police grid numbers to include in result (e.g. ?grid=38,65). By default all
police grids should be included.
neighborhood - comma separated list of neighborhood numbers to include in result (e.g. ?id=11,14). By
default all neighborhoods should be included.
limit - maximum number of incidents to include in result (e.g. ?limit=50). By default the limit should be
10,000.
*/

function getIncidentsObjectFromRows(rows){
    let incidents = {};
    rows.forEach(row => {
        let caseNumber = row['case_number'];
        let dateTime = row['date_time'];
        let date, time;
        [date, time] = dateTime.split('T');
        incidents['I'+caseNumber] = {
            'date': date,
            'time': time,
            'code': row['code'],
            'incident': row['incident'],
            'police_grid': row['police_grid'],
            'neighborhood_number': row['neighborhood_number'],
            'block': row['block'],
        };
    });
    return incidents;
}


// General function use in all routing
function queryDatabase(sqlQuery){
    // Create promise that will query db for codes
    return new Promise( (resolve, reject) => {
        db.all(sqlQuery, (err, rows) => {
            if (err) {
                reject();
            } else {
                resolve(rows);
            }
        });
    });
}
// General function use in all routing
function formatResponse(responseObject, formatParam){
    let response, contentType;
    // Default format is JSON, if XML in 'format' URL param then use XML
    if(formatParam === 'XML'){
        response = xmlConverter.js2xml(responseObject, {compact: false, spaces: 4});
        contentType = 'application/xml';
    } else {
        response = JSON.stringify(responseObject);
        contentType = 'application/json';
    }
    return {response: response, contentType: contentType};
}
// General function use in all routing
function writeResponse(res, sqlQuery, buildObjectFunction, formatParam){
    queryDatabase(sqlQuery)
        .then(rows => {
            let object = buildObjectFunction(rows);
            let r = formatResponse(object, formatParam);
            res.writeHead(200, {'Content-Type': r.contentType});
            res.write(r.response); // JSON or XML representation of codes object
            res.end();
        }).catch(err => {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.write('Error while querying database');
        res.end();
    });
}





// PUT /new-incident
// Upload incident data to be inserted into the SQLite3 database
app.put('/new-incident', (req, res) => {
    // console.log(req.body);
    let caseNumber = '12234314'; // real one: 12234314, req.body.case_number
    let promise = new Promise( (resolve, reject) => {
        db.get("SELECT case_number FROM Incidents WHERE case_number = ?", caseNumber, (err, row) => {
            // if row is undefined then case number does not exist
            if(err){
                reject();
            }else {
                if (row) {
                    reject('exists');
                } else {
                    resolve();
                }
            }
        });
    });
    promise.then(a => {
        console.log('insert');
        // let values = ['0000', '2015-10-29T07:46:00', 2, '1', 2, 3, '1'];
        // console.log(req.body);
        // // Getting error saying database is readonly
        // db.run("INSERT INTO Incidents VALUES (?, ?, ?, ?, ?, ?, ?)", values, (err, rows) => {
        //     console.log(err);
        //     console.log(rows);
        // });
    });
    promise.catch( (err) => {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        if(err === 'exists') {
            res.write('Case number already exists in the database');
        } else {
            res.write('Error while querying database');
        }
        res.end();
    })

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