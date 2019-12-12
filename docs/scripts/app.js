

let app;

function init() {

    app = new Vue({
        el: "#app",
        data: {
            latitude: 44.94317442551431,
            longitude: -93.10775756835939,
            incidents: {},
            showTable: false,
            address: "",
            visibleNeighborhoods: [],
            neighborhoods: {},
            neighborhoodsOnMap: [1, 2],
            codes: {},
            markers: []
        },
        methods: {
            // When 'Go' is pressed
            changeLatLng: function() {
                // Move map to lat and lng with panning animation
                map.panTo([this.latitude, this.longitude]);
            },
            visible: function(neighborhoodNumber) {
                return this.neighborhoodsOnMap.includes(neighborhoodNumber);
            },
            neighborhoodName: function(neighborhoodNumber) {
                return this.neighborhoods[neighborhoodNumber].name
            },
            incidentType: function(code) {
                return this.codes[code]
            },
            filter: function(){
                this.updateNeighborhoodsOnMap();
                popupsForNeighborhoods();
            },
            updateNeighborhoodsOnMap: function(){
                this.neighborhoodsOnMap = [];
                for(let n in this.neighborhoods) {
                    let bounds = map.getBounds();
                    let lat = this.neighborhoods[n].latitude;
                    let lng = this.neighborhoods[n].longitude;
                    if (lat > bounds._southWest.lat && lat < bounds._northEast.lat && lng > bounds._southWest.lng && lng < bounds._northEast.lng) {
                        this.neighborhoodsOnMap.push(parseInt(n));
                    }
                }
            }
        }
    });

    createLeafletMap();
    setupNeighborhoods();
    getCodes();
    getIncidents();
    // addMarkers();
}

let map;
function createLeafletMap(){
    let stPaulLatLng = [app.latitude, app.longitude]; // Latitude and longitude of St. Paul
    // Create map with custom settings
    map = L.map('map', {
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
    }).addTo(map);
    // Put zoom buttons in top right
    L.control.zoom({
        position:'topright'
    }).addTo(map);

    map.on('click', onMapClick); // Click map
    map.on('moveend', onMapChange); // Pan finished
    map.on('zoomend', onMapChange); // Zoom finished

    addBoundary();
}

// When map is zoomed or panned set latitude and longitude inputs to where map is
function onMapChange(){
    console.log('change');
    let latLng = map.getCenter();
    app.latitude = latLng.lat;
    app.longitude = latLng.lng;
}

let popup = L.popup();
function onMapClick(e) {
    popup.setLatLng(e.latlng).setContent("You clicked the map at " + e.latlng.toString()).openOn(map);
}

// Puts polygon around St. Paul on map
function addBoundary(){
    // Polygon for St. Paul
    L.polygon([
        [44.987922, -93.207506],
        [44.991685, -93.005289],
        [44.891321, -93.004774],
        [44.919406, -93.050779],
        [44.919649, -93.128541],
        [44.887429, -93.173517],
        [44.909195, -93.202013]
    ], {fill: false, color: '#000'}).addTo(map);
}

function getIncidents(){
    let apiUrl = 'http://localhost:8000/incidents?start_date=2019-10-01&end_date=2019-10-31';
    $.getJSON(apiUrl)
        .then(data => {
            app.incidents = data;
        });
}

function getCodes(){
    let apiUrl = 'http://localhost:8000/codes';
    $.getJSON(apiUrl)
        .then(data => {
            for(let c in data){
                app.codes[c.substring(1)] = data[c];
            }
        });
}

function setupNeighborhoods(){
    // Get all neighborhoods names
    $.getJSON('http://localhost:8000/neighborhoods')
        .then(data => {
            // Loop through neighborhood names
            for(let i=1; i<=17; i++){
                app.neighborhoods[i] = {};
                let name = data['N'+i];
                app.neighborhoods[i].name = name; // match code to name
                getNeighborhoodLatLng(name)
                    .then(data => {
                        app.neighborhoods[i].latitude = parseFloat(data[0].lat);
                        app.neighborhoods[i].longitude = parseFloat(data[0].lon);
                    });
            }
        });
}

// Get the latitude and longitude for neighborhood using neighborhood name
function getNeighborhoodLatLng(neighborhood){
    // neighborhood = 'Greater East Side'
    let country = 'United States',
        state = 'Minnesota',
        city = 'St. Paul';
    let apiUrl = 'https://nominatim.openstreetmap.org/search?format=json&country='+country+'&state='+state+'&city='+city+'&q='+neighborhood;
    // return promise
    return $.getJSON(apiUrl);
}

// Get the latitude and longitude for inputted address
function getLatLngFromAddress(){
    // 495 Sherburne Ave
    let apiUrl = 'https://nominatim.openstreetmap.org/search?format=json&country=United States&state=MN&city=St. Paul&street='+app.address;
    $.getJSON(apiUrl)
    .then(data => {
        app.latitude = data[0].lat;
        app.longitude = data[0].lon;
        map.panTo([app.latitude, app.longitude]);
    });
}

function popupsForNeighborhoods(){
    app.markers.forEach(marker => {
        marker.remove();
    });
    console.log('c');
    for(let n in app.neighborhoods){
        if(app.neighborhoodsOnMap.includes(parseInt(n))){
            let latLng = [ app.neighborhoods[n].latitude,  app.neighborhoods[n].longitude];
            let marker = L.marker(latLng, {title: 'test'}).addTo(map);
            app.markers.push(marker);
        }
    }
}
