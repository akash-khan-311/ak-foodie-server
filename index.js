const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ak-foodie-fellowship.netlify.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Verify Token

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized" });
  }
  jwt.verify(token, process.env.ACESS_TOKEN_SCRETE, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "unauthorizedd" });
    }
    req.user = decoded;
    next();
  });
};

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

    // Generate Web Token

    app.post("/api/v1/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACESS_TOKEN_SCRETE, {
        expiresIn: "10h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ message: true });
    });

    app.post("/api/v1/addfood", async (req, res) => {
      const food = req.body;
      const result = await foodsCollection.insertOne(food);
      res.send(result);
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

    app.get("/api/v1/myfood", verifyToken, async (req, res) => {
      let query = {};
      if (req.query.email !== req.user.email) {
        return res.status(403).send({ message: "Forbidden" });
      }
      if (req.query?.email) {
        query = { email: req.query.email };
      }

      const result = await foodsCollection.find(query).toArray();
      res.send(result);
    });

    app.patch("/api/v1/requestfood/:id", async (req, res) => {
      const requestFood = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const newFood = {
        $set: {
          requesterDonate: requestFood.requesterDonate,
          requesterNotes: requestFood.requesterNotes,
          requesterName: requestFood.requesterName,
          requesterImg: requestFood.requesterImg,
          requesterEmail: requestFood.requesterEmail,
          requestDate: requestFood.requestDate,
          requested: requestFood.requested,
        },
      };

      const result = await foodsCollection.updateOne(filter, newFood);
      res.send(result);
    });
    // Get Requested Food from Database
    app.get("/api/v1/requestfood/:email", verifyToken, async (req, res) => {
      const userEmail = req.params.email;
      if (req.params.email !== req.user.email) {
        return res.status(403).send({ message: "Forbidden" });
      }
      const result = await foodsCollection
        .find({ requested: true, requesterEmail: userEmail })
        .toArray();
      res.send(result);
    });

    // Delete From Database
    app.delete("/api/v1/deleted/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.deleteOne(query);
      res.send(result);
    });

    // Cancel food request - Updated
    app.patch("/api/v1/updated/:id", async (req, res) => {
      const id = req.params.id;
      const food = req.body;
      const filter = { _id: new ObjectId(id) };

      const newFood = {
        $set: {
          requesterDonate: null,
          requesterNotes: null,
          requesterName: null,
          requesterImg: null,
          requesterEmail: null,
          requestDate: null,
          requested: null,
        },
      };

      const result = await foodsCollection.updateOne(filter, newFood);
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
