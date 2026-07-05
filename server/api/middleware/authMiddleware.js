const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/Emp_onboarding");

const Middleware = async (req, res, next) => {
  let token;

  console.log("bearerrrr", req.headers.authorization, req);

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      console.log("ggyutyt");
      
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token,process.env.JWT_SECRET);
        
     const user = await User.findOne({
        where:{
            id: decoded.userId,
        },
      });
      console.log(user,"user..");
      

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { Middleware };
