const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
var cron = require('node-cron');
const app = express();
const port = 3000;
const resClient = {};
const resServer = {};

// Clear resClient, resServer after 1 hour
cron.schedule('0 * * * *', () => {
  const timestamp = new Date().valueOf();

  for (const property in resClient) {
    if (timestamp - resClient[property].timestamp > 3600000) {
      delete resClient[property]
    }
  }

  for (const property in resServer) {
    if (timestamp - resServer[property].timestamp > 3600000) {
      delete resServer[property]
    }
  }
});

app.use(cors({ origin: "*" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setTimeout(300000, () => {
    return res.status(408).send("Timeout");
  });
  next();
});

app.get("/server/:idRoom", (req, res) => {
  const roomId = req.params.idRoom;

  if (!roomId) {
    return res.status(400).send("Bad Request");
  }

  const timestamp = new Date().valueOf();
  resServer[roomId] = { res, timestamp };
});

app.post("/server", (req, res) => {
  const { resId, sdp } = req.body;

  if (!sdp || !resId) {
    return res.status(400).send("resId, sdp are required");
  }

  if (!resClient[resId]) {
    return res.status(500).send("Client not found");
  }

  resClient[resId].res.json({sdp});
  console.log('opk')
  delete resClient[resId];
  return res.send({ ok: 1 });
});

app.post("/client", (req, res) => {
  const { sdp, roomId } = req.body;
  // console.log(sdp)

  if (!sdp || !roomId) {
    return res.status(400).send("sdp and roomId are required");
  }

  if (!resServer[roomId]) {
    return res.status(500).send("Server not found");
  }

  const timestamp = new Date().valueOf();
  const resId = `${uuidv4()}_${roomId}`;

  resClient[resId] = { res, timestamp };
  resServer[roomId].res.json({ resId, sdp });
  delete resServer[roomId];
});

app.get("/room-id", (req, res) => {
  const roomId = `${uuidv4()}-min`;
  res.send(roomId)
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
