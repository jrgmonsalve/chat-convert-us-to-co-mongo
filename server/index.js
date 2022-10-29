import express from "express";
import http from "http";
import morgan from "morgan";
import { Server as SocketServer } from "socket.io";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import {
  SERVER_PORT,
  CLIENT_PORT,
  CURRENCY_API_KEY,
  CURRENCY_API_URL,
  MONGO_STR_CONNECTION
} from "./config.js";
import cors from "cors";
import axios from "axios";
import {MongoClient} from "mongodb";


// Initializations

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: `http://localhost:${CLIENT_PORT}`,
  },
});
const __dirname = dirname(fileURLToPath(import.meta.url));

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));

app.use(express.static(join(__dirname, "../client/build")));

io.on("connection", (socket) => {
  console.log(socket.id);
  socket.on("message", async (body) => {
    body = await extraTools(body)
    socket.broadcast.emit("message", {
      body,
      from: socket.id.slice(8),
    });
  });
});

server.listen(SERVER_PORT);
console.log(`server on port ${SERVER_PORT}`);

async function insert(body) {
  const uri = MONGO_STR_CONNECTION;
  const client = new MongoClient(uri);

  try {
    const database = client.db("cluster0");
    const collection = database.collection("logs");
    // create a document to insert
    
    const result = await collection.insertOne(body);
    console.log(`A document was inserted with the _id: ${result.insertedId}`);
  } finally {
    await client.close();
  }
}


async function extraTools(text) {
  let usd_amount = extracAmount(text);

  if (usd_amount==0){
    return text
  }

  let cop_amount=0;
  let headers = {
    headers: {
      apikey: CURRENCY_API_KEY
    }
  }
  let query_string = `/currency_data/convert?to=COP&from=USD&amount=${usd_amount}`

  const resp = await axios.get(CURRENCY_API_URL + query_string, headers).then(function (response) {
    return response.data;
  });
  cop_amount=resp.result;
  let new_text = text.replace(`USD:${usd_amount}`, `COP:${cop_amount}`);
  let body = {
    "initial_text":text,
    "final_text":new_text,
    "query_string":query_string,
    "response":resp,
    "timestamp":Date.now()
  }
  await insert(body)

  return new_text;
  
}

function extracAmount(text){
  let usd_amount="0";
  text = text.replace(/ /g,'');
  const regex = /USD:\d*\.?\d*/g;
  
  let pre_usd_amount = text.match(regex);
  if (Array.isArray(pre_usd_amount) && pre_usd_amount.length > 0){
      usd_amount = pre_usd_amount[0]
  }
  
  return usd_amount.replace('USD:','')
}