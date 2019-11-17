// Built-in Node.js modules
// var fs = require('fs');
let path = require('path');
let bodyParser = require('body-parser'); // For parsing params in requests
let xmlConverter = require('xml-js'); // For converting JS objects to XML

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


//let public_dir = path.join(__dirname, 'public'); probably will need this from part 2
let db_filename = path.join(__dirname, 'database', 'stpaul_crime.sqlite3');

let app = express();
app.use(bodyParser.urlencoded({extended: true})); // allows us to get PUT request body

let port = 8000;

// open usenergy.sqlite3 database for reading and writing
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    } else {
        console.log('Now connected to ' + db_filename);
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
// Responds with a JSON or XML string with codes mapped to their corresponding incident type
// ?code=110,700, default all codes
// ?format=xml, default json
app.get('/codes', (req, res) => {
    let formatParam = req.query.format; // ?format=xml
    let codeParam = req.query.code; // ?code=110,700
    // use provided codes to make a SQL query
    let sqlQuery = buildSqlQueryForCodes(codeParam);
    writeResponse(res, sqlQuery, getCodesObjectFromRows, formatParam);
});

// Build the SQL query for getting all codes and associated incident type
// codeParam filters codes to only those requested
function buildSqlQueryForCodes(codeParam){
    let sql, codes;
    // Build SQL query using optional 'code' URL param
    sql = 'SELECT * FROM Codes';
    if(codeParam){ // if 'code' URL param was supplied
        codes = codeParam.split(',');
        // Joins the codes [110,700] together to make 'code=110 OR code = 700'
        sql += ' WHERE code = ' + codes.join(' OR code = ');
    }
    sql += ' ORDER BY code ASC';
    // Without code param provided: SELECT * FROM Codes ORDER BY code ASC
    // With: SELECT * FROM Codes WHERE code = 110 OR code = 700 ORDER BY code ASC
    return sql;
}

// Creates object to map code to incident type
// rows are the rows returned from database, an array of { code: 652, incident_type: '...' }
function getCodesObjectFromRows(rows){
    console.log(rows);
    let code, incidentType;
    let codes = {};
    // Loop through codes and put them in object
    rows.forEach(row => {
        code = row['code'];
        incidentType = row['incident_type'];
        codes['C'+code] = incidentType;
    });
    // { "C110": "Murder, Non Negligent Manslaughter" }
    return codes;
}


// GET /neighborhoods
// Responds with a JSON or XML string with neighborhood numbers mapped to their corresponding neighborhood name
// ?id=1,2, default all neighborhoods
// ?format=xml, default json
app.get('/neighborhoods', (req, res) => {
    let formatParam = req.query.format; // ?format=xml
    let idParam = req.query.id; // ?id=1,2
    // use provided ids (neighborhood numbers) to make a SQL query
    let sqlQuery = buildSqlQueryForNeighborhoods(idParam);
    writeResponse(res, sqlQuery, getNeighborhoodsObjectFromRows, formatParam);
});

// Build the SQL query for getting all neighborhood numbers and corresponding neighborhood name
// idParam filters neighborhoods to only those requested
function buildSqlQueryForNeighborhoods(idParam){
    let sql, ids;
    // Build SQL query using optional 'id' URL param
    sql = 'SELECT * FROM Neighborhoods';
    if(idParam){ // if 'id' URL param was supplied
        ids = idParam.split(',');
        // Joins ids [1,2] together to make 'id=1 OR id = 2'
        sql += ' WHERE neighborhood_number = ' + ids.join(' OR neighborhood_number = ');
    }
    sql += ' ORDER BY neighborhood_number ASC';
    // Without code param provided: SELECT * FROM Neighborhoods ORDER BY neighborhood_number ASC
    // With: SELECT * FROM Neighborhoods WHERE neighborhood_number = 1 OR neighborhood_number = 2 ORDER BY neighborhood_number ASC
    return sql;
}

// Creates object to map neighborhood id to neighborhood name
// rows are the rows returned from database, an array of { neighborhood_number: 13, neighborhood_name: 'Union Park' }
function getNeighborhoodsObjectFromRows(rows){
    let neighborhoodNumber, neighborhoodName;
    let neighborhoods = {};
    // Loop through neighborhoods and put them in an object
    rows.forEach(row => {
        neighborhoodNumber = row['neighborhood_number'];
        neighborhoodName = row['neighborhood_name'];
        neighborhoods['N'+neighborhoodNumber] = neighborhoodName;
    });
    // { "N1": "Conway/Battlecreek/Highwood", }
    return neighborhoods;
}

// GET /incidents
// Responds with a JSON or XML string with crime incidents ids mapped to when and where they happened
// ?id=1,2, default 10,00 most recent crime incidents
// ?format=xml, default json
app.get('/incidents', (req, res) => {
    let formatParam = req.query.format;
    let params = req.query;
    // use any of the provided params to make a SQL query
    // possible params 'start_date', 'end_date', 'code', 'grid', 'neighborhood', 'limit'
    let sqlQuery = buildSqlQueryForIncidents(params);
    writeResponse(res, sqlQuery, getIncidentsObjectFromRows, formatParam);
});

// Work-in-progress <==============
// Build the SQL query for getting all crime incidents and when and where they happened
// the params can filter by any database column
function buildSqlQueryForIncidents(params){
    let sql, ids;
    // Build SQL query using all optional URL params
    sql = 'SELECT * FROM Incidents';
	// loop through params and use them in where if they're in this array
    // ==> This actually won't work correctly, needs to be changed
	let possibleParams = ['start_date', 'end_date', 'code', 'grid', 'neighborhood', 'limit'];
	for(let param in params) {
		if(param in possibleParams){
			let paramValue = params[param];
			//sql += ' WHERE ' + param + ' = ' + ids.join(' OR neighborhood_number = '); // not done
			sql += ' WHERE ' + param + ' = ' + paramValue; // not done
		}
	}
	// start_date, end_date, etc will need to be dealt with seperatly
    // if(idParam){ // if 'id' URL param was supplied
    //     ids = idParam.split(',');
    //     sql += ' WHERE neighborhood_number = ' + ids.join(' OR neighborhood_number = ');
    // }
    sql += ' ORDER BY date_time DESC LIMIT 10'; // default 10,000, limiting to 10 currently
    // Without params provided: SELECT * FROM Incidents ORDER BY date_time DESC LIMIT 10
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

// Creates object that maps incidents to when and where they happened
// rows are the rows returned from database, an array of
// "I19245020": { "date": "2019-10-30", "time": "23:57:08.000", "code": 9954, "incident": "Proactive Police Visit",
// "police_grid": 87, "neighborhood_number": 7, "block": "THOMAS AV  & VICTORIA" }
function getIncidentsObjectFromRows(rows){
    let incidents = {};
    // Loop through incidents and put them in an object
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
    // I19244992: { date: '2019-10-30', time: '23:15:10.000', code: 700, incident: 'Auto Theft', police_grid: 95,
    // neighborhood_number: 4, block: '79X 6 ST E' }
    return incidents;
}


// Helper function for query database using provided SQL query
function queryDatabase(sqlQuery){
    // Creates and returns promise that will resolve when rows are received
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
// Helper function for formatting rows received from db into JSON or XML
// Loops through rows and puts them in object according to param 'buildObjectFunction' which is a callback to
// a route specific function for formatting rows correctly then using 'formatParam' it will format that
// object into either JSON or XML
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
// Helper function for converting object into XML or JSON
// if 'formatParam' == 'XML' then XML otherwise JSON
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





// Work-in-progress <==============
// PUT /new-incident
// Upload incident data to be inserted into the SQLite3 database
app.put('/new-incident', (req, res) => {
    // console.log(req.body);
	let body = req.body;
    let caseNumber = '12234314'; //body.case_number // real one: 12234314, req.body.case_number
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
        let values = ['0000', '2015-10-29T07:46:00', 2, '1', 2, 3, '1'];
		// this isn't accurate
		value = [body.case_number, body.date, body.date, body.time, body.code, body.incident, body.police_grid, body.block];
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