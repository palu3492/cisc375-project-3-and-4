

let app;

function init() {

    app = new Vue({
        el: "#app",
        data: {
            mapLatitude: 44.94317442551431,
            mapLongitude: -93.10775756835939
        },
        methods: {
            latLngChange: function() {
                console.log(this.mapLatitude);
                leafletMap.panTo([this.mapLatitude, this.mapLongitude]);
            }
        }
    });

    leafletMapInit();
}

let leafletMap;
function leafletMapInit(){
    // console.log(app);
    let stPaulLatLng = [app.mapLatitude, app.mapLongitude]; // Latitude and longitude of St. Paul
    leafletMap = L.map('map', {minZoom: 12, maxZoom: 17}).setView(stPaulLatLng, 12); // mouse click-and-drag and scroll wheel interaction available by default

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        accessToken: 'pk.eyJ1IjoiYWpwMCIsImEiOiJjazN4cGd4MGQxNW1hM3F0NnU5M3Jiem80In0.71DleDv1Fm-ArumkU37BjA'
    }).addTo(leafletMap);

    leafletMap.on('click', onMapClick);
    leafletMap.on('move', onMapChange);
    leafletMap.on('zoom', onMapChange);

    addPolygon();
}

function onMapChange(){
    let latLng = leafletMap.getCenter();
    app.mapLatitude = latLng.lat;
    app.mapLongitude = latLng.lng;
}

let popup = L.popup();
function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(leafletMap);
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
    ]).addTo(leafletMap);
}