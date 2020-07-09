const express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var fs = require("fs");
const { json } = require("express");
var light = { state: false };
app.use(express.static("public"));
app.get("/", function (req, res) {
  // res.sendFile(__dirname + "/public/index.html");
  res.sendFile("/public/index.html");
});
io.on("connection", function (socket) {
  socket.on("device-id", (data) => {
    socket.join(data);
    console.log("Channel Joined ", data);
  });

  socket.on("fetch-live", (data) => {
    console.log("---------Requesting Live Data From Sensor--------");
    socket.emit("light", { state: true });
  });

  socket.on("push-live", (data) => {
    console.log("Received Live Data", data);
    socket.emit("live-data-to-user", data);
  });

  socket.on("disconnect", function () {
    console.log("User disconnected: " + socket.id);
  });

  socket.on("track-data", (_data) => {
    var j = [];
    j = _data.split(",");
    var data = {};
    j.forEach((element) => {
      const tatti = element.split(":");
      data[tatti[0].trim()] = tatti[1].trim();
    });
    console.log(data);

    if (data) {
      const apiKey = data.apiKey;
      const humidity = data.humidity;
      const temp = data.temp;
      const timestamp = Date.now();

      const payLoad = {
        humidity,
        temp,
        timestamp,
      };

      fs.appendFile(
        `dataCollected-${apiKey}.txt`,
        JSON.stringify(payLoad) + "\n",
        function (err) {
          if (err) throw err;
        }
      );
    }

    fs.readFile(
      `dataCollected-${data.apiKey}.txt`,
      "utf8",
      (error, filedata) => {
        if (error) {
          console.log("Error Reading file");
        } else {
          var _array = [];
          _array = filedata.split(/\n|\r/g);
          _array.pop();
          io.in(data.apiKey).emit("track-live", _array);
        }
      }
    );
  });

  socket.on("clearLogs", (data) => {
    if (data) {
      fs.unlink(`dataCollected-${data.apiKey}.txt`, function (err) {
        if (err) {
          console.log("No Such File Exists or Something went Wrong");
        }
        console.log("File deleted!");
      });
    }
  });
});

http.listen(3000, function () {
  console.log("listening on *:3000");
});

/***
 * Sending to all the client in room apikey
 *
 */
