import { DrawChart } from "../scripts/charts.js";
const _trackData = document.getElementById("_trackData");
var ctx1 = document.getElementById("myChart1").getContext("2d");
var ctx2 = document.getElementById("myChart2").getContext("2d");
const clearLogs = document.getElementById("clearLogs");
const dataset = document.getElementById("dataset");
const deviceId = document.getElementById("deviceId");
const save = document.getElementById("save");
const edit = document.getElementById("edit");
const liveDataSensor = document.getElementById("live-data-sensor");
const loading = document.getElementById("loading");
let key = localStorage.getItem("DeviceId");

const socket = io("http://13.232.193.81:3000/");
// const socket = io("http://localhost:3000/");

liveDataSensor.style.display = "none";

edit.onclick = () => {
  localStorage.removeItem("DeviceId");
  key = null;
  window.location.reload();
};

if (key != null) {
  deviceId.value = key;
  deviceId.setAttribute("disabled", true);
  socket.emit("device-id", key);
}

save.onclick = () => {
  localStorage.setItem("DeviceId", deviceId.value);
  deviceId.setAttribute("disabled", true);
  key = deviceId.value;
  socket.emit("device-id", key);
};

DrawChart([], [], ctx1, "Temperature");
DrawChart([], [], ctx2, "Humidity");

$("#goLive").on("click", function () {
  // alert();
  socket.emit("fetch-live", { state: true });
});

socket.on("live-data-to-user", function (liveData) {
  if (liveData) {
    if ((liveDataSensor.style.display = "none")) {
      liveDataSensor.style.display = "block";
    }
    $("#live-data-sensor").text(
      `Temperature:${liveData.temp}, Humidity:${liveData.humidity}`
    );
  }
});

_trackData.onclick = () => {
  // console.log("taati");
  if (key == null) {
    alert("ApiKey or DeviceId is undefined");
    return;
  }
  const payload = `apiKey: ${key},temp: ${Math.floor(
    Math.random() * 100
  )},humidity: ${Math.floor(Math.random() * 100)}`;
  socket.emit("track-data", payload);
};

clearLogs.onclick = () => {
  if (key == null) {
    alert("ApiKey or DeviceId is undefined");
    return;
  }
  socket.emit("clearLogs", { apiKey: `${key}` });
  dataset.innerText = "";
  DrawChart([], [], ctx1, "Temperature");
  DrawChart([], [], ctx2, "Humidity");
};

var xLabel = [];
var yLabel = [];
var _x_data = [];

socket.on("track-live", (data) => {
  console.log("TrackLive Event Fired");
  data.reverse();
  dataset.innerText = data;
  let _threshold;
  if (data.length < 10) _threshold = data.length;
  else _threshold = 10;
  for (let i = 0; i < _threshold; i++) {
    const item = JSON.parse(data[i]);
    xLabel[i] = parseInt(item.humidity);
    yLabel[i] = parseInt(item.temp);
    _x_data[i] = i;
  }
  DrawChart(yLabel, _x_data, ctx1, "Temperature");
  DrawChart(xLabel, _x_data, ctx2, "Humidity");
});
