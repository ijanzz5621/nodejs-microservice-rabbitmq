// imports
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
// rabbit mq
const amqp = require("amqplib");

// import models
const Order = require("./Order");
const isAuthenticated = require("../isAuthenticated");

//variables
var channel, connection;

// instances
const app = express();
mongoose.connect("mongodb://localhost:27017/order-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, () => {
    console.log("Order-Service DB connected...");
});

// variables
const PORT = process.env.PORT_TWO || 5050;

// midlleware
app.use(express.json());

// function
async function connect() {
    const amqpServer = "amqp://192.168.144.79:5678";
    connection = amqp.connect(amqpServer);
    channel = (await connection).createChannel();

    // queue name: PRODUCT
    (await channel).assertQueue("ORDER");
}

// connect().then(() => {
//     channel.consume("ORDER", (data) => {
//         const { products, userEmail } = JSON.parse(data.content);

//         console.log(`Order from ${userEmail} received!`);

//         channel.ack(data);
//     });
// });

function createOrder(products, userEmail) {
    let total = 0;
    for (let t=0; t<products.length;t++)
    {
        total += products[t].price;
    }
    const newOrder = new Order({
        products,
        user: userEmail,
        total_price: total
    });
    newOrder.save();
    return newOrder;
}

var q = 'ORDER';
var open = require('amqplib').connect('amqp://192.168.144.79:5678');
// Consumer
open.then(function(conn) {
    return conn.createChannel();
  }).then(function(ch) {
    return ch.assertQueue(q).then(function(ok) {
      return ch.consume(q, function(msg) {
        if (msg !== null) {
          //console.log(JSON.parse(msg).content.toString());
          console.log(JSON.parse(msg.content));
          const {products, userEmail} = JSON.parse(msg.content);
          const newOrder = createOrder(products, userEmail);
          
          ch.ack(msg);
        }
      });
    });
  }).catch(console.warn);

app.listen(PORT, () => {
    console.log(`Order-Service running at Port ${PORT}...`);
})

