// Built-in Node.js modules
let path = require('path');
let bodyParser = require('body-parser'); // For parsing params in requests

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');
let cors = require('cors');
let EasyXml = require('easyxml'); // For converting JS objects to XML


//let public_dir = path.join(__dirname, 'public'); probably will need this from part 2
let db_filename = path.join(__dirname, 'database', 'stpaul_crime.sqlite3');

let app = express();
app.use(bodyParser.urlencoded({extended: true})); // allows us to get PUT request body
app.use(cors());

let port = 8000;

// open stpaul_crime.sqlite3 database for reading and writing
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, err => {
    if (err) {
        console.log("Error opening stpaul_crime.sqlite3");
    } else {
        console.log("Now connected to stpaul_crime.sqlite3");
    }
});

let serializer = new EasyXml({
    singularize: true,
    rootElement: 'response',
    dateFormat: 'ISO',
    manifest: true
});

// GET /codes
// Responds with a JSON or XML string with codes mapped to their corresponding incident type
// ?code=110,700, default all codes
// ?format=xml, default json
app.get('/codes', (req, res) => {
    let formatParam = req.query.format; // ?format=xml
    let codeParam = req.query.code; // ?code=110,700
    // use provided codes to make a SQL query
    let sqlQuery = buildSqlQueryForCodes(codeParam);
    queryDatabase(sqlQuery)
    .then(rows => {
        // Make db rows into an object
        let object = getCodesObjectFromRows(rows);
        // Turn object holding response into JSON or XML and get correct return type
        let responseData = formatResponse(object, formatParam);
        // Response with XML or JSON
        respondWithData(res, responseData.contentType, responseData.response)
    }).catch(err => {
        respondWithError(res)
    });
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
    // Use provided ids (neighborhood numbers) to make a SQL query
    let sqlQuery = buildSqlQueryForNeighborhoods(idParam);
    queryDatabase(sqlQuery)
    .then(rows => {
        // Make db rows into an object
        let object = getNeighborhoodsObjectFromRows(rows);
        // Turn object holding response into JSON or XML and get correct return type
        let responseData = formatResponse(object, formatParam);
        // Response with XML or JSON
        respondWithData(res, responseData.contentType, responseData.response)
    }).catch(err => {
        respondWithError(res)
    });
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
// 'rows' are the rows returned from database, an array of { neighborhood_number: 13, neighborhood_name: 'Union Park' }
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
    queryDatabase(sqlQuery)
    .then(rows => {
        // Make db rows into an object
        let object = getIncidentsObjectFromRows(rows);
        // Turn object holding response into JSON or XML and get correct return type
        let responseData = formatResponse(object, formatParam);
        // Response with XML or JSON
        respondWithData(res, responseData.contentType, responseData.response)
    }).catch(err => {
        respondWithError(res)
    });
});

// Build the SQL query for getting all crime incidents and when and where they happened
// the params can neighborhoodUpdate by any database column
function buildSqlQueryForIncidents(params){
    let sql;
    // Build SQL query using all optional URL params
    sql = 'SELECT * FROM Incidents';
    // map params to database column
    let possibleParams = {code: 'code', grid: 'police_grid', id: 'neighborhood_number'}; // id is neighborhood which is neighborhood_number in db
    let whereClause;
    let whereClauses  = []; // array of WHERE clauses of sql query
    for(let param in params){
        if(params.hasOwnProperty(param)) {
            let paramTrim = param.trim(); // not needed but came up in testing
            if (Object.keys(possibleParams).includes(paramTrim)) {
                let paramSplit = params[param].split(',');
                paramSplit = paramSplit.filter(e => { // remove any empty strings
                    return e.trim() !== '';
                });
                // example: OR code = 117 OR code = 112
                // Only add where clause if array isn't empty
                if(paramSplit.length) {
                    whereClause = "(" + possibleParams[paramTrim] + ' = ' + paramSplit.join(' OR ' + possibleParams[paramTrim] + ' = ') + ")";
                    whereClauses.push(whereClause);
                }
            }
        }
    }
    // start_date, end_date, limit filtering
    if(Object.keys(params).includes('start_date') && params['start_date'].trim() !== ''){  // if 'start_date' URL param was supplied
        whereClause = 'date_time >= '+ "'" + params['start_date'] + "'";
        whereClauses.push(whereClause);
    }
    if(Object.keys(params).includes('end_date') && params['end_date'].trim() !== ''){  // if 'end_date' URL param was supplied
        whereClause = 'date_time <= ' + "'" + params['end_date'] + "'";
        whereClauses.push(whereClause);
    }
    let limit = 10000; // default 10,000, limiting to 10 currently
    if(Object.keys(params).includes('limit') && params['limit'].trim() !== ''){ // if 'limit' URL param was supplied
        limit = params['limit'];
    }
    // Join all where clauses together with AND in the middle
    if(whereClauses.length){
        sql += ' WHERE ' + whereClauses.join(' AND ');
    }
    sql += ' ORDER BY date_time DESC LIMIT ' + limit;
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

case_number (TEXT), date_time (DATETIME), code (INTEGER), incident (TEXT), police_grid (INTEGER),
neighborhood_number (INTEGER), block (TEXT)
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
                console.log(err);
                reject();
            } else {
                resolve(rows);
            }
        });
    });
}

// Helper function for converting object into XML or JSON
// if 'formatParam' == 'XML' then XML otherwise JSON
function formatResponse(responseObject, formatParam){
    let response, contentType;
    // Default format is JSON, if XML in 'format' URL param then use XML
    if(formatParam === 'xml'){
        response = serializer.render(responseObject);
        // response = xmlConverter.js2xml(responseObject, {compact: false, spaces: 4});
        contentType = 'application/xml';
    } else {
        response = JSON.stringify(responseObject);
        contentType = 'application/json';
    }
    return {response: response, contentType: contentType};
}

function respondWithData(res, contentType, response){
    res.writeHead(200, {'Content-Type': contentType});
    res.write(response); // JSON or XML representation of response object
    res.end();
}

function respondWithError(res){
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.write('Error while querying database');
    res.end();
}

// PUT /new-incident
// Upload incident data to be inserted into db
app.put("/new-incident", (req, res) => {
    let body = req.body;
    // let caseNumber = "12234314";
    let caseNumber = body.case_number; // Doesn't need to be an int
    doesCaseNumberExist(caseNumber)
    .then(() => {
        insertNewIncident(body);
        res.writeHead(200); // Response with 200 'request has succeeded'
        res.end();
    })
    .catch((err) => {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        if(err === 'exists') {
            res.write('Case number already exists in the database');
        } else {
            res.write('Error while querying database');
        }
        res.end();
    });
});

// Checks if case number to be put into database already exists
// Returns a promise which will resolve if case number doesn't exist and reject if it does exist
function doesCaseNumberExist(caseNumber){
  return new Promise( (resolve, reject) => {
      db.get("SELECT case_number FROM Incidents WHERE case_number = ?", caseNumber, (err, row) => {
          if(err){
              reject();
          }else {
              // if row is undefined then case number does not exist
              if(row){
                  reject('exists');
              }else{
                  resolve();
              }
          }
      });
  });
}

// Inserts new incident into database using the values in the body of PUT request
function insertNewIncident(body){
    // 'body' data fields:
    // case_number, date, time, code, incident, police_grid, neighborhood_number, block

    // date and time need to be joined together and go into column date_time
    let dateTime = body.date+'T'+body.time;

    // Order of columns in db. Values need to be inserted in this order.
    // case_number (TEXT), date_time (DATETIME), code (INTEGER), incident (TEXT),
    // police_grid (INTEGER), neighborhood_number (INTEGER), block (TEXT)
    //
    // let values = ['0000', '2015-10-29T07:46:00', 2, '1', 2, 3, '1']; // For testing empty body PUT requests
    // These values can all be strings, they will be converted to correct type in db
    // example: [ '1231', '2019-10-30T23:57:08.000', '23423', 'Proactive Police Visit', '87', '7', 'THOMAS AV  & VICTORIA' ]
    let values = [
        body.case_number, dateTime, body.code, body.incident, body.police_grid, body.neighborhood_number, body.block
    ];
    // Insert a new incident into Incidents table
    // Each question mark is replaced with corresponding value in 'values' array at that index
    db.run("INSERT INTO Incidents VALUES (?, ?, ?, ?, ?, ?, ?)", values);
}

console.log('Listening on port ' + port);
let server = app.listen(port);