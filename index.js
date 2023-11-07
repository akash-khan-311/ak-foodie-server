const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    app.get("/api/v1/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });

    app.get("/api/v1/availablefoods", async (req, res) => {
      const cursor = foodsCollection.find({});
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/api/v1/myfood", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await foodsCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/api/v1/requestfood", async (req, res) => {
      const requestFood = req.body;
      const result = await foodsCollection.insertOne(requestFood);
      res.send(result);
    });
    // Get Requested Food from Database
    app.get("/api/v1/requestfood/:email", async (req, res) => {
      const userEmail = req.params.email;
      const result = await foodsCollection
        .find({ requested: true, requesterEmail: userEmail })
        .toArray();
      res.send(result);
    });

    // Cancel food request - Delete
    app.delete("/api/v1/deleted/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.deleteOne(query);
      res.send(result);
    });

    // Get Data for Manage Signle food - Get Signle Data

    app.get("/api/v1/manage/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });

    // Update Manage Signle food - Update Manage Signle
    app.patch("/api/v1/manage/:id", async (req, res) => {
      const id = req.params.id;
      const updatedStatus = req.body;
      const filter = { _id: new ObjectId(id) };
      const setUpdatedStatus = {
        $set: {
          status: updatedStatus.selectedValue,
        },
      };
      const result = await foodsCollection.updateOne(filter, setUpdatedStatus);
      res.send(result);
      console.log(result);
    });

    // Edit Manage Signle food - Update

    app.put("/api/v1/update/:id", async (req, res) => {
      const id = req.params.id;
      const updatedFood = req.body;
      const filter = { _id: new ObjectId(id) };
      const newFood = {
        $set: {
          email: updatedFood.email,
          foodName: updatedFood.foodName,
          foodImg: updatedFood.foodImg,
          expiredDate: updatedFood.expiredDate,
          status: updatedFood.status,
          donatorName: updatedFood.donatorName,
          donatorImg: updatedFood.donatorImg,
          donationMoney: updatedFood.donationMoney,
          quantity: updatedFood.quantity,
          pickupLocation: updatedFood.pickupLocation,
          aditionalNotes: updatedFood.aditionalNotes,
        },
      };
      const options = { upsert: true };
      const result = await foodsCollection.updateOne(filter, newFood, options);
      res.send(result);
      console.log(result);
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
