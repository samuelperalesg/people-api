//  DEPENDENCIES
const express = require("express")
const morgan = require("morgan")
const mongoose = require("mongoose");
const cors = require("cors");
const admin = require("firebase-admin");


// Initalize the express app
const app = express();

// configuring server settings
require("dotenv").config();

// expose our config variables
const { MONGODB_URL, PORT = 4000, GOOGLE_CREDENTIALS } = process.env

const serviceAccount = JSON.parse(GOOGLE_CREDENTIALS)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})


// connect to mongoDB
mongoose.connect(MONGODB_URL)

// set up our mongoDB event listeners
const db = mongoose.connection

db
.on("connected", () => console.log("Connected to MongoDB"))
.on("disconnected", () => console.log("Disconnected from MongoDB"))
.on("error", (err) => console.log("MongoDB Error: " + err.message))

const peopleSchema = new mongoose.Schema(
  {
    name: String,
    image: String,
    title: String,
    uid: String
  }, { timestamps: true })

const People = mongoose.model("People", peopleSchema)


// mount middleware
app.use(express.json()) // this creates req.body using incoming JSON from our requests
app.use(morgan("dev"))
app.use(cors())

// set up people model
app.use(async function(req, res, next) {
  try {
      const token = req.get('Authorization');
      if(!token) return next();

      const user = await admin.auth().verifyIdToken(token.replace('Bearer ', ''));
      if(!user) throw new Error('something went wrong');

      req.user = user;
      next();
  } catch (error) {
      res.status(400).json(error);
  }
});

function isAuthenticated(req, res, next) {
  if(!req.user) return res.status(401).json({message: 'you must be logged in first'})
  next();
}


// routes
app.get("/", (req, res) => {
  res.send("welcome to the people api")
})

// INDEX ROUTE
app.get('/people', isAuthenticated, async (req, res) => {
  try {
      res.json(await People.find({uid: req.user.uid}));
  } catch (error) {
      res.status(400).json(error);
  }
});

// CREATE ROUTE
app.post('/people', isAuthenticated, async (req, res) => {
  try {
      req.body.uid = req.user.uid;
      res.json(await People.create(req.body));
  } catch (error) {
      res.status(400).json(error);
  }
});


// UPDATE ROUTE
app.put("/people/:id", async (req, res) => {
  try {
    res.json(
      await People.findByIdAndUpdate(
        req.params.id,
        req.body,
      {
        new: true,
      })
    ) //new will return new with mongoDB
  } catch (error) {
    res.status(400).json(error)
  }
})

// DELETE ROUTE
app.delete("/people/:id", async (req, res) => {
  try {
    res.json(await People.findByIdAndDelete(req.params.id))
  } catch (error) {
    res.status(400).json(error)
  }
})

// tell the app to listen
app.listen(PORT, () => {
  console.log(`Express is listening on port ${PORT}`)
})
