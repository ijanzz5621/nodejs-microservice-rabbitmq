const jwt = require("jsonwebtoken");

module.exports = async function isAuthenticated(req, res, next) {
    // "Bearer <token>".split(" ");
    // ["Bearer", "<tokne>"]

    if (req.headers["authorization"]) {
        // get the token
        const token = req.headers["authorization"].split(" ")[1];

        // verify the token
        jwt.verify(token, "secrets", (err, user) => {
            if (err) return res.json({message: err});

            req.user = user;
            next();
        });
    }
    else {
        return res.json({message: "No authorization found."}); 
    }
}