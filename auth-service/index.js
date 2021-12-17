// imports
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// import models
const User = require("./User");

// instances
const app = express();
mongoose.connect("mongodb://localhost:27017/auth-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, () => {
    console.log("Auth-Service DB connected...");
});

// variables
const PORT = process.env.PORT_ONE || 7070;

// midlleware
app.use(express.json());

// apis
// register
app.post("/auth/register", async (req, res) => {
    //const { name, email, password } = req.body;
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    const userExists = await User.findOne({ email });
    if (userExists)
    {
        return res.json({ message: "User already exist." });
    }

    // create user
    const newUser = new User({
        name,
        email,
        password
    });
    // save to db
    newUser.save();

    console.log(newUser);
    return res.json(newUser);
});

// login
app.post("/auth/login", async (req, res) => {

    const { email, password } = req.body; 
    const user = await User.findOne({email});

    if (!user)
    {
        return res.json({message: "User doesn't exist."});
    }

    // check if the password is correct or wrong
    if (password !== user.password)
    {
        return res.json({message: "Password incorrect."});
    }

    // create a token payload
    const payload = {
        email,
        name: user.name
    };
    jwt.sign(payload, "secrets", (err, token) => {
        if (err) console.log(err);

        return res.json({token: token});
    });
});

app.listen(PORT, () => {
    console.log(`Auth-Service at ${PORT}`);
})

