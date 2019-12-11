

let app;

function init() {

    app = new Vue({
        el: "#app",
        data: {
            latitude: 44.94317442551431,
            longitude: -93.10775756835939,
            incidents: [],
            showTable: true,
            address: ""
        },
        methods: {
            // When 'Go' is pressed
            changeLatLng: function() {
                // Move map to lat and lng with panning animation
                leafletMap.panTo([this.mapLatitude, this.mapLongitude]);
            }
        }
    });

    createLeafletMap();
}

let leafletMap;
function createLeafletMap(){
    let stPaulLatLng = [app.latitude, app.longitude]; // Latitude and longitude of St. Paul
    // Create map with custom settings
    leafletMap = L.map('map', {
        minZoom: 13,
        maxZoom: 17,
        maxBounds: [[44.875822, -92.984848],[44.99564, -93.229122]],
        center: stPaulLatLng,
        zoom: 13,
        zoomControl: false
    });
    // Set map layers to mapbox
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 17,
        id: 'mapbox/streets-v11',
        accessToken: 'pk.eyJ1IjoiYWpwMCIsImEiOiJjazN4cGd4MGQxNW1hM3F0NnU5M3Jiem80In0.71DleDv1Fm-ArumkU37BjA', // token to use mapbox
    }).addTo(leafletMap);
    // Put zoom buttons in top right
    L.control.zoom({
        position:'topright'
    }).addTo(leafletMap);

    leafletMap.on('click', onMapClick); // Click map
    leafletMap.on('moveend', onMapChange); // Pan finished
    leafletMap.on('zoomend', onMapChange); // Zoom finished

    addPolygon();
}

// When map is zoomed or panned set latitude and longitude inputs to where map is
function onMapChange(){
    let latLng = leafletMap.getCenter();
    app.latitude = latLng.lat;
    app.longitude = latLng.lng;
}

let popup = L.popup();
function onMapClick(e) {
    popup.setLatLng(e.latlng).setContent("You clicked the map at " + e.latlng.toString()).openOn(leafletMap);
}

function addPolygon(){
    // Polygon for St. Paul
    let polygon = L.polygon([
        [44.987922, -93.207506],
        [44.991685, -93.005289],
        [44.891321, -93.004774],
        [44.919406, -93.050779],
        [44.919649, -93.128541],
        [44.887429, -93.173517],
        [44.909195, -93.202013]
    ], {fill: false, color: '#000'}).addTo(leafletMap);
}

function crimeData(){
    // By default, include crimes from 10/01/2019 to 10/31/2019
    app.incidents = [];
    let neighborhoods = {};

    let apiUrl = 'http://localhost:8000/incidents?start_date=2019-10-01&end_date=2019-10-31&limit=10';
    $.getJSON(apiUrl)
    .then(data => {
        for(let i in data){
            let incident = data[i];
            let neighborhood_name, incident_type;
            $.when(
                $.getJSON('http://localhost:8000/neighborhoods?id='+incident.neighborhood_number, (data) => {
                    neighborhood_name = data['N'+incident.neighborhood_number];
                    incident.neighborhood_name = neighborhood_name;
                }),
                $.getJSON('http://localhost:8000/codes?code='+incident.code, (data) => {
                    incident_type = data['C'+incident.code];
                    incident.incident_type = incident_type;
                })
            ).then(() => {
                this.incidents.push(incident);
            })
        }
    });
}

let neighborhoods = {};

function test(){
    let apiUrl = 'http://localhost:8000/incidents';
    $.getJSON(apiUrl)
    .then(data => {
        for(let incident in data){
            let num = data[incident].neighborhood_number;
            if(neighborhoods[num]) {
                neighborhoods[num] += 1;
            } else{
                neighborhoods[num] = 1;
            }
        }
        console.log(neighborhoods);
        // data.forEach(incident => {
        //     console.log();
        // })
    });
}

// Get the latitude and longitude for inputted address
function getLatLngFromAddress(){
    // 495 Sherburne Ave
    let apiUrl = 'https://nominatim.openstreetmap.org/search?format=json&country=United States&state=MN&city=St. Paul&street=';
    $.getJSON(apiUrl+app.address)
    .then(data => {
        app.latitude = data[0].lat;
        app.longitude = data[0].lon;
        leafletMap.panTo([app.latitude, app.longitude]);
    });
}

// Get the latitude and longitude for neighborhood that a incident happened in
function getLatLngForNeighborhood(){
    let apiUrl = 'https://nominatim.openstreetmap.org/search?format=json&country=United States&state=MN&city=St. Paul&q=';
    $.getJSON(apiUrl+"Thomas/Dale(Frogtown)")
    .then(data => {
        console.log(data);
    });
}

function getLatLngOfMap(){
    let bounds = leafletMap.getBounds(); // northeast and southwest corner
    console.log(bounds);
}