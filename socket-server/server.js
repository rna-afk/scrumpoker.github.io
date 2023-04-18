var express = require('express');
var cors = require('cors');
var axios = require("axios");
var http = require("http");
var cheerio = require("cheerio");
var fs = require('fs');
var socket = require("socket.io");
var path = require('path');

var app = express();
var socketServer = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "scrumpoker", "build")))

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + "scrumpoker/build/index.html"))
});

var auth1 = process.env.JIRA_TOKEN;
var issues;

if (auth1 == undefined || auth1 == null || auth1 == "") {
    console.log("No JIRA token set. exiting")
    process.exit()
}
axios.defaults.headers.common["Authorization"] = "Bearer " + auth1

function refreshJIRA() {
    axios.post("https://issues.redhat.com/rest/api/2/search", {
        "jql": '(project = CORS OR project = OCPBUGSM AND component in (Installer) AND (Subcomponent ~ openshift-ansible OR Subcomponent ~ openshift-installer) AND component in (componentMatch(openshift-installer), componentMatch(openshift-ansible))) AND status in ("14434", "14436", "10017", "15726", "14445", "14452", "6", "10822", "10016", "12422", "10015", "10018", "15723", "10020") AND issuetype != "16" AND status not in ("10015", "6", "10822", "10017") AND (cf[12310940] is EMPTY OR cf[12310940] not in futureSprints() AND cf[12310940] not in openSprints()) AND "Story Points" is EMPTY ORDER BY Rank ASC',
        "startAt": "0"
    }).then((urlResponse) => {
        issues = urlResponse.data.issues;
    });
    // fs.readFile('test.json', 'utf8', function (err, data) {
    //     issues = JSON.parse(data);
    // });
}
refreshJIRA();
app.get("/jira", function (req, res) {
    res.send(issues);
});

app.get("/refresh", function (req, res) {
    refreshJIRA();
    res.send(issues);
})

var socketServer = http.createServer((req, res) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
    };

    res.writeHead(200, headers);
    res.end('Hello World');
    return;
});
const io = socket(socketServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

var dictVotes = {}
var tally = {}
io.on("connection", (socket) => {
    console.log("connected")
    socket.on("vote", (arg) => {
        id = arg.id;
        vote = arg.vote;
        dictVotes[id] = vote;

        tally = {}
        for (const [key, value] of Object.entries(dictVotes)) {
            tally[value] = (tally[value] ?? 0) + 1
        }

        console.log(tally);
        console.log(dictVotes);
        socket.emit("standings", tally);
    });

    socket.on("card", (arg) => {
        socket.emit("changeCard", arg);
        dictVotes = {}
        tally = {}
    })
    socket.on("refresh", data => {
        socket.emit("refresh", {});
    })
    socket.on("deleteCard", (arg) => {
        socket.emit("deleteCard", arg);
        dictVotes = {}
        tally = {}
    })
    socket.on("showList", (arg) => {
        socket.emit("showList", arg);
        dictVotes = {}
        tally = {}
    })
    socket.on("skip", (arg) => {
        socket.emit("skipCard", arg);
    })

    socket.on("submit", (arg) => {
        //update JIRA card arg.id with arg.value
        axios.get("https://issues.redhat.com/rest/api/3/" + arg.id, {
        }).then((urlResponse) => {
            ticket = urlResponse.data;
            console.log(ticket);
            ticket["storyPoint"] = arg.storyPoint
            axios.put("https://issues.redhat.com/rest/api/3/" + arg.id, ticket).then((urlResponse) => { console.log(urlResponse) });
            console.log(arg);
            tally = {};
            dictVotes = {};
            socket.emit("standings", tally);
        })
    });
});

var server = app.listen(12345, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
});

socketServer.listen(3000);

