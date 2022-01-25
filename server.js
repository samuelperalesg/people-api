//  DEPENDENCIES
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");

// Initalize the express app
const app = express();

// configuring server settings
require("dotenv").config();

// expose our config variables
const { MONGODB_URL, PORT = 4000 } = process.env;

// connect to mongoDB
mongoose.connect(MONGODB_URL);

// set up our mongoDB event listeners
const db = mongoose.connection;

db.on("connected", () => console.log("Connected to MongoDB"))
  .on("disconnected", () => console.log("Disconnected from MongoDB"))
  .on("error", (err) => console.log("MongoDB Error: " + err.message));

// mount middleware
app.use(express.json()); // this creates req.body using incoming JSON from our requests
app.use(morgan("dev"));
app.use(cors());

// set up people model
const peopleSchema = new mongoose.Schema(
  {
    name: String,
    image: String,
    title: String,
  },
  { timestamps: true }
);

const People = mongoose.model("People", peopleSchema);

// routes
app.get("/", (req, res) => {
  res.send("welcome to the people api");
});

// INDEX ROUTE
app.get("/people", async (req, res) => {
  try {
    res.json(await People.find({}));
  } catch (error) {
    res.status(400).json(error);
  }
});

// CREATE ROUTE
app.post("/people", async (req, res) => {
  try {
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
    ); //new will return new with mongoDB
  } catch (error) {
    res.status(400).json(error);
  }
});

// DELETE ROUTE
app.delete("/people/:id", async (req, res) => {
  try {
    res.json(await People.findByIdAndDelete(req.params.id))
  } catch (error) {
    res.status(400).json(error)
  }
});

// tell the app to listen
app.listen(PORT, () => {
  console.log(`Express is listening on port ${PORT}`);
});
