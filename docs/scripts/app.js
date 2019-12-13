

let app;

function init() {

    app = new Vue({
        el: "#app",
        data: {
            // Menu
            showMenu: false,
            // Options
            latitude: 44.94317442551431,
            longitude: -93.10775756835939,
            address: "",
            // Table
            incidents: {},
            visibleNeighborhoods: [],
            neighborhoods: {},
            neighborhoodsOnMap: [],
            codes: {},
            neighborhoodMarkers: [],
            incidentMarkers: [],
            loaded: false,
            violentCrimes: {
                1: ""
            },
            dateStart: "",
            dateEnd: "",
            timeStart: "",
            timeEnd: "",
            incidentFilter: {},
            neighborhoodFilter: {}
        },
        computed: {
            collapseImage: function(){
                if(!this.showMenu){
                    return '-webkit-transform: scaleX(-1); transform: scaleX(-1);'
                }
                return '';
            }
        },
        methods: {
            toggleMenu: function(){
                this.showMenu = !this.showMenu;
            },
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
            removeIncidentMarkers: function(){
                app.incidentMarkers.forEach(marker => {
                    marker.remove();
                });
                alert('Incident markers removed');
            },
            violentCrimeBg: function(code){
                // violent crimes
                // property crimes
                // other
                // code = code.substring(1);
                if(110 <= code && code <= 566){
                    return "background: #ffaaaa;;"
                } else if (600 <= code && code <= 1436){
                    return "background: #ffffaa;"
                }
                return "background: #aaffaa;"
            }
        }
    });

    createLeafletMap();
    populateNeighborhoods();
    neighborhoodUpdate();
    getCodes();
    getIncidents();
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

    map.on('moveend', onMapChange); // Pan finished
    map.on('zoomend', onMapChange); // Zoom finished

    addBoundary();
}

// When map is zoomed or panned set latitude and longitude inputs to where map is
function onMapChange(){
    let latLng = map.getCenter();
    app.latitude = latLng.lat;
    app.longitude = latLng.lng;
    // updateAddress();
    updateNeighborhoodsOnMap();
}

function updateAddress(){
    let apiUrl = 'https://nominatim.openstreetmap.org/reverse?format=json&lat='+app.latitude+'&lon='+app.longitude+'&zoom=18&addressdetails=1';
    $.getJSON(apiUrl)
        .then(data => {
            let addressParts = [];
            if(data.address.house_number) {
                addressParts.push(data.address.house_number);
            }
            if(data.address.road){
                addressParts.push(data.address.road);
            }
            if(addressParts.length > 0) {
                app.address = addressParts.join(' ');
            }else{
                app.address = 'No address';
            }
        })
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

function populateNeighborhoods(){
    app.neighborhoods = {
        1: {
            name: "Conway/Battlecreek/Highwood",
            latitude: 44.956758,
            longitude: -93.015139
        },
        2: {
            name: "Greater East Side",
            latitude: 44.977519,
            longitude: -93.025290
        },
        3: {
            name: "West Side",
            latitude: 44.931369,
            longitude: -93.082249
        },
        4: {
            name: "Dayton's Bluff",
            latitude: 44.957164,
            longitude: -93.057100
        },
        5: {
            name: "Payne/Phalen",
            latitude: 44.978208,
            longitude: -93.069673
        },
        6: {
            name: "North End",
            latitude: 44.977405,
            longitude: -93.110969
        },
        7: {
            name: "Thomas/Dale(Frogtown)",
            latitude: 44.960265,
            longitude: -93.118686
        },
        8: {
            name: "Summit/University",
            latitude: 44.948581,
            longitude: -93.128205
        },
        9: {
            name: "West Seventh",
            latitude: 44.931735,
            longitude: -93.119224
        },
        10: {
            name: "Como",
            latitude: 44.982860,
            longitude: -93.150844
        },
        11: {
            name: "Hamline/Midway",
            latitude: 44.962891,
            longitude: -93.167436
        },
        12: {
            name: "St. Anthony",
            latitude: 44.973546,
            longitude: -93.195991
        },
        13: {
            name: "Union Park",
            latitude: 44.948401,
            longitude: -93.174050
        },
        14: {
            name: "Macalester-Groveland",
            latitude: 44.934301,
            longitude: -93.175363
        },
        15: {
            name: "Highland",
            latitude: 44.911489,
            longitude: -93.172075
        },
        16: {
            name: "Summit Hill",
            latitude: 44.937493,
            longitude: -93.136353
        },
        17: {
            name: "Capitol River",
            latitude: 44.950459,
            longitude: -93.096462
        }
    }
}

// Get the latitude and longitude for neighborhood using neighborhood name
function getNeighborhoodLatLng(neighborhoodName){
    // neighborhood = 'Greater East Side'
    let country = 'United States',
        state = 'Minnesota',
        city = 'St. Paul';
    let apiUrl = 'https://nominatim.openstreetmap.org/search?format=json&country='+country+'&state='+state+'&q='+neighborhoodName;
    // return promise
    return $.getJSON(apiUrl);
}

function updateNeighborhoodsOnMap() {
    app.neighborhoodsOnMap = [];
    for(let n in app.neighborhoods) {
        let bounds = map.getBounds();
        let lat = app.neighborhoods[n].latitude;
        let lng = app.neighborhoods[n].longitude;
        if (lat > bounds._southWest.lat && lat < bounds._northEast.lat && lng > bounds._southWest.lng && lng < bounds._northEast.lng) {
            app.neighborhoodsOnMap.push(parseInt(n));
        }
    }
}

// Get the latitude and longitude for inputted address
function getLatLngFromAddress(address){
    // 495 Sherburne Ave
    let apiUrl = 'https://nominatim.openstreetmap.org/search?format=json&country=United States&state=MN&city=St. Paul&street='+address;
    return $.getJSON(apiUrl)
}

function searchAddress(){
    getLatLngFromAddress(app.address)
        .then(data => {
            if(data.length > 0) {
                app.latitude = data[0].lat;
                app.longitude = data[0].lon;
                map.panTo([app.latitude, app.longitude]);
            } else {
                alert("Address '"+app.address+"' not found")
            }
        });
}

let markerIcon = L.icon({
    iconUrl: 'images/marker-icon.png',
    iconSize: [25, 41]
});
function addIncidentMarker(address, date, time, incident){
    address = address.replace('X', '0');
    getLatLngFromAddress(address)
        .then(data => {
            if(data.length > 0) {
                let lat = data[0].lat;
                let lng = data[0].lon;
                // Create a popup with date, time, incident, and delete button when hovering over that marker
                let popup = L.popup({closeOnClick: false, autoClose: false}).setContent([address, date, time, incident].join('<br/> '));
                let marker = L.marker([lat, lng], {icon: markerIcon, title: address}).bindPopup(popup).addTo(map);
                app.incidentMarkers.push(marker);
            } else {
                alert("Address '"+address+"' not found");
            }
        });
}

function neighborhoodsPopups(){
    app.neighborhoodMarkers.forEach(marker => {
        marker.remove();
    });
    for(let n in app.neighborhoods){
        if(app.neighborhoodsOnMap.includes(parseInt(n))){
            let latLng = [app.neighborhoods[n].latitude,  app.neighborhoods[n].longitude];
            let name = app.neighborhoods[n].name;
            let count = app.neighborhoods[n].count;
            let popup = L.popup({closeOnClick: false, autoClose: false}).setContent(name);
            let marker = L.marker(latLng, {title: name, id:'n'}).bindPopup(popup).addTo(map).openPopup();
            app.neighborhoodMarkers.push(marker);
        }
    }
}

function neighborhoodUpdate(){
    updateNeighborhoodsOnMap();
    neighborhoodsPopups();
}