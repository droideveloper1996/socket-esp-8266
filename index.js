const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);
const PORT = process.env.PORT || 4000;

io.on("connection", (socket) => {
  const greeting = {
    from: "Server",
    data: `Welcome ESP-8266 your socket id is -->${socket.id} `,
  };
  console.log(` New Device Communicated with Socket ID ${socket.id}`);
  io.to(socket.id).emit("welcome", greeting);
  socket.on("acknowledge", (data) => {
    console.log(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
