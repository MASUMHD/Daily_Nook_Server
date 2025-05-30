const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DN_USER}:${process.env.DN_PASS}@cluster0.zi8pxok.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("Database Connected");

    // Collections
    const productsCollection = client.db("Daily_Nook").collection("products");
    const usersCollection = client.db("Daily_Nook").collection("users");
    const cartCollection = client.db("Daily_Nook").collection("cart");

    // add users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // show users
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // Add Product
    app.post("/products", async (req, res) => {
      const product = req.body;
      console.log(product);
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    // Get All Products
    app.get("/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });

    // Add to cart
    app.post("/cart", async (req, res) => {
      const item = req.body;
      const result = await cartCollection.insertOne(item);
      res.send(result);
    });

    // Get show cart items
    app.get("/cart", async (req, res) => {
      const result = await cartCollection.find().toArray();
      res.send(result);
    });

    // Delete cart item

    app.delete("/cart/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    

    // Default route
    app.get("/", (req, res) => {
      res.send("Daily Nook Server is running");
    });

    // Start server after DB is ready
    app.listen(port, () => {
      console.log(`🚀 Daily Nook Server is running on port ${port}`);
    });
  } catch (error) {
    console.log("❌ Error:", error.name, error.message);
  }
}

run();
