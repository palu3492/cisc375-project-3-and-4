var app;
var auth_data = {};

function Init()
{
    // Spotify authentication
    if (!window.location.hash || window.location.hash.length < 15 || window.location.hash.substring(0, 14) !== "#access_token=")
    {
        let spotify_client_id = "f134f3efd6ba45bf886a52ad2290156b";
        
        window.location = "https://accounts.spotify.com/authorize?client_id=" + spotify_client_id + 
                          "&response_type=token&redirect_uri=" + window.location.origin + "/index.html" +
                          "&state=1234";
    }

    // Actual app, once authenticated
    let i, key_val;
    let auth_array = window.location.hash.substring(1).split("&");
    for (i = 0; i < auth_array.length; i++)
    {
        key_val = auth_array[i].split("=");
        if (key_val.length === 2)
        {
            auth_data[key_val[0]] = key_val[1];
        }
    }
    

    app = new Vue({
        el: "#app",
        data: {
            spotify_search: "",
            spotify_type: "artist",
            spotify_type_options: [
                { value: "album", text: "Album" },
                { value: "artist", text: "Artist" },
                { value: "playlist", text: "Playlist" },
                { value: "track", text: "Track" }
            ],
            search_results: []
        },
        computed: {
            input_placeholder: function() {
                if (this.spotify_type[0] === "a")
                    return "Search for an " + this.spotify_type;
                return "Search for a " + this.spotify_type;
            }
        }
    });
}

function VueExample(event)
{
    if (app.spotify_search !== "")
    {
        let request = {
            url: "https://api.spotify.com/v1/search?q=" + app.spotify_search + "&type=" + app.spotify_type,
            dataType: "json",
            headers: {
                "Authorization": auth_data.token_type + " " + auth_data.access_token
            },
            success: SpotifyData
        };
        $.ajax(request);
    }
    else
    {
        app.search_results = [];
    }
}

function SpotifyData(data)
{
    app.search_results = data[app.spotify_type + "s"].items;
    console.log(data);
}
