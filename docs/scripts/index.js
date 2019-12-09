

let app;

function init() {
    app = new Vue({
        el: "#app",
        data: {
            spotify_search: "",
            spotify_type: "artist",
            spotify_type_options: [],
            search_results: []
        },
    });

    let stPaulLatLng = [44.9397629,-93.1410728]; // Latitude and longitude of St. Paul
    let leafletMap = L.map('map').setView(stPaulLatLng, 13);

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        accessToken: 'pk.eyJ1IjoiYWpwMCIsImEiOiJjazN4cGd4MGQxNW1hM3F0NnU5M3Jiem80In0.71DleDv1Fm-ArumkU37BjA'
    }).addTo(leafletMap);
}