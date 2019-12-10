

function getCrime(){
    let url = 'http://localhost:8000/incidents';
    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
        // successfully received data!
        }
    };
    req.open("GET", url,true);
    req.send();
}