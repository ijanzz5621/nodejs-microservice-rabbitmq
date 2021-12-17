// imports
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
// rabbit mq
const amqp = require("amqplib");

// import models
const Product = require("./Product");
const isAuthenticated = require("../isAuthenticated");

//variables
var channel, connection;

// instances
const app = express();
mongoose.connect("mongodb://localhost:27017/product-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, () => {
    console.log("Product-Service DB connected...");
});

// variables
const PORT = process.env.PORT_TWO || 6060;

// midlleware
app.use(express.json());

// function
async function connect() {
    const amqpServer = "amqp://192.168.144.79:5678";
    connection = amqp.connect(amqpServer);
    channel = (await connection).createChannel();

    // queue name: PRODUCT
    (await channel).assertQueue("PRODUCT");
}

connect();

// APIs
// Create a new product
app.post("/product/create", isAuthenticated, async (req, res) => {
    const { name, description, price} = req.body;
    
    // check if product already exist
    const productExist = await Product.findOne({name});
    if (productExist) {
        return res.json({message: `Product ${name} already exist.`});
    }
    
    const newProduct = new Product({
        name,
        description,
        price
    });
    newProduct.save();

    return res.json(newProduct);
});

// Buy a new product
// User send list of product IDs to buy
app.post("/product/buy", isAuthenticated, async (req, res) => {
    const { ids } = req.body;

    console.log(ids);

    const products = await Product.find({_id: {$in: ids}});

    // channel.sendToQueue("ORDER", Buffer.from(JSON.stringify({
    //     products,
    //     userEmail: req.user.email
    // })));

    var open = require('amqplib').connect('amqp://192.168.144.79:5678');
    open.then(function(conn) {
        return conn.createChannel();
      }).then(function(ch) {
        return ch.assertQueue("ORDER").then(function(ok) {
          return ch.sendToQueue("ORDER", Buffer.from(JSON.stringify({
                 products,
                 userEmail: req.user.email
            })), {}, (err, ok) => {
                if (err !== null) console.warn('Message nacked!');
                else console.log('Message nacked');
            });
        });
      }).catch(console.warn);

      res.json({message:"Order has been sent!"})

});

app.listen(PORT, () => {
    console.log(`Product-Service at ${PORT}`);
})

