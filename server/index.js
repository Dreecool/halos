const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs")
const PORT = 3001;
const crypto = require('crypto');
const secretKey = crypto.randomBytes(32).toString('hex');
const http = require("http");
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server, {
  cors: {
        origin: "https://halos-lyyb.vercel.app",
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});

mongoose.connect("mongodb+srv://francesdonaire:chatforte123456@chat-forte-db.xnufm5f.mongodb.net/chat-forte?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Register = require("./model/register");
const Message = require("./model/messages");

app.use(
  cors({
    origin: ["https://halos-lyyb.vercel.app"],
    methods: ["POST, GET, DELETE, PUT"],
    credentials: true,
  })
);


app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));



app.post("/registerUser", async (req, res) => {
  const full_name = req.body.full_name;
  const email_address = req.body.email_address;
  const password = req.body.password;
  const status = req.body.status

  try {

    const saltRounds = 10; 
    const hash = await bcrypt.hash(password, saltRounds);

    const RegisterUser = new Register({
      full_name: full_name,
      email_address: email_address,
      password: hash, 
      status: status
    });

    await RegisterUser.save();
    console.log("success");

    res.status(200).json({ message: 'Registration successful' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Registration failed' });
  }
});



app.post("/loginUser", async (req, res) => {
  const { email_address, password } = req.body;

  try {
    const existingUser = await Register.findOne({ email_address });

    if (existingUser) {
      const isPasswordValid = await bcrypt.compare(password, existingUser.password);

      if (isPasswordValid) {

        const userId = existingUser._id;

        const token = jwt.sign({ userId }, secretKey, { expiresIn: "1d" });

        res.status(200).json({tok: token});
      
    
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ message: 'Email not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
});


const verifyToken = async(req, res, next) => {

  const token = req.headers.authorization;

  if (!token) {

    return res.json({ message: 'Unauthorized' });

  }

  jwt.verify(token.split(' ')[1], secretKey, (err, decoded) => {

    if (err) {

      return res.status(403).json({ message: 'Token is not valid' });

    }
    
    req.userId = decoded.userId;
    

    next(); 

  });
};


app.get('/protectedRoute', verifyToken, (req, res) => {

  const userId = req.userId

  res.status(200).json({ message: 'Authorized', userID: userId});

});



//sockets

io.on('connection', async (socket) => {

  try {

    //when user login the status will update
    socket.on("userID", async(id) => {

      try {

        await Register.findByIdAndUpdate(id, { status: true });

        console.log("updated status success", id)
      
      } catch(error) {

        console.log(error)

      }


    })
    
    socket.on('send-id', async (userID) => {

      // After receiving the user ID, emit a string to the frontend
      console.log(userID)

      try {

        if(!userID) {

          return;

        } 

          const onlineUsers = await Register.find({ status: true, _id: { $ne: userID } });

          console.log(onlineUsers);
         

        socket.emit("sended", onlineUsers)
        
      

      } catch(error) {


        console.log(error)


      }

  
    });




  } catch (error) {


    console.error(error);
  }

});


server.listen(PORT, () => {
   console.log("server is running") 
})
