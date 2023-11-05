const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 3000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.pnvzqzb.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const database = client.db("foodDb");
    const foodsCollection = database.collection("foods");

    app.post("/api/v1/addfood", async (req, res) => {
      const food = req.body;
      const result = await foodsCollection.insertOne(food);
      res.send(result);
      console.log(result);
    });

    app.get("/api/v1/featuredfoods", async (req, res) => {
      const cursor = foodsCollection.find({}).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Food Server Is Running");
});

app.listen(port, () => {
  console.log("listening on port", port);
});
