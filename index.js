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

app.get('/OTA/download/',(req,res)=>{
  const file = `${__dirname}/public/firmware/v1/firmware.bin`;
  res.download(file);
})
var deviceId;
io.on("connection", function (socket) {
 console.log("A new Client Joined via Socket",socket.id);
  socket.on("device-id", (data) => {
    socket.join(data, () => {
      deviceId = data;
    });

    console.log("Channel Joined ", data);
  });

socket.on("device-update-status",data=>{	
	console.log("OTA-Confirmation from device",data);
});
 socket.on("fetch-live", (data) => {
    console.log("---------Requesting Live Data From Sensor--------");
   console.log("Fetch-Live Device Key",deviceId); 
   io.in(deviceId).emit("light", { state: true });
  });

socket.on("fall-event",(data)=>{
if(data){
  console.log("Ohhh! Seems Patient had a fall");
  }
});
socket.on("push-ota",(data)=>{

const otaID=Math.floor((Math.random()*1000000)+1);
io.in(deviceId).emit("ota-update",data+otaID);
io.in(deviceId).emit("ota-id",otaID);
console.log(`OTA requested by Client console -${deviceId} `,data+otaID)

//  io.in(deviceId).emit("ota-action-status",200);
});
  socket.on("push-live", (data) => {
    console.log("Received Live Data", data);
    io.in(data.apiKey).emit("live-data-to-user", data);
  });
socket.on("ota-status",(data)=>{
 console.log("OTA STATUS ",data);
 io.in(deviceId).emit("ota-action-status",data);
});
  socket.on("disconnect", function () {
    console.log("User disconnected: " + socket.id);
  });

socket.on("track-data", (_data) => {
console.log("motherfuckers ",_data);
    var j = [];
    j = _data.split(",");
    var data = {};
    j.forEach((element) => {
      const tatti = element.split(":");
      data[tatti[0].trim()] = tatti[1].trim();
    });
    console.log(data);

    if (data) {

      const humidity = data.humidity;
      const temp = data.temp;
      const timestamp = Date.now();

      const payLoad = {
        humidity,
        temp,
        timestamp,
      };

      fs.appendFile(
        `dataCollected-${deviceId}.txt`,
        JSON.stringify(payLoad) + "\n",
        function (err) {
          if (err) throw err;
        }
      );
    }

    fs.readFile(`dataCollected-${deviceId}.txt`, "utf8", (error, filedata) => {
      if (error) {
        console.log("Error Reading file");
      } else {
        var _array = [];
        _array = filedata.split(/\n|\r/g);
        _array.pop();
        io.in(data.apiKey).emit("track-live", _array);
      }
    });
  });

  socket.on("clearLogs", (data) => {
    if (data) {
      fs.unlink(`dataCollected-${deviceId}.txt`, function (err) {
        if (err) {
          console.log("No Such File Exists or Something went Wrong");
        }
        console.log("File deleted!");
      });
    }
  });
});

app.get('/test-end-point',(req,res)=>{
	res.status(200).json({message:'test end point hot succesful'});
});
http.listen(3000, function () {
  console.log("listening on *:3000");
});

/***
 * Sending to all the client in room apikey
 *
 */
