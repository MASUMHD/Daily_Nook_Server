const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: [
    "http://localhost:5173",  
    "https://daily-nook.vercel.app"  
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
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

    // Update user
    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      const { username, email, role } = req.body;
      try {
        const result = await usersCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { username, email, role } }
        );
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: err.message });
      }
    });

    // Delete user
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await usersCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 0) {
          return res.status(404).send({ message: "User not found" });
        }
        res.send({ message: "User deleted successfully" });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
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

    // Update product
    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      const result = await productsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedProduct }
      );
      res.send(result);
    });

    // Delete product
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const result = await productsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // Add to cart
    app.post("/cart", async (req, res) => {
      const { productId, email } = req.body;

      const existingUserQuery = await cartCollection.find({ email }).toArray();

      const existingItem = existingUserQuery.find(
        (cartItem) => cartItem.productId === productId
      );

      if (existingItem) {
        return res.status(400).send({ message: "Product already in cart" });
      }

      const result = await cartCollection.insertOne({ productId, email });
      res.send(result);
    });

    // Get show cart items
    app.get("/cart", async (req, res) => {
      const email = req.query.email;
      if (!email)
        return res.send({ message: "Email query parameter is required" });

      const cartItems = await cartCollection.find({ email }).toArray();

      const productIds = cartItems.map((item) => new ObjectId(item.productId));
      const products = await productsCollection
        .find({ _id: { $in: productIds } })
        .toArray();

      const merged = cartItems.map((cartItem) => {
        const product = products.find(
          (p) => p._id.toString() === cartItem.productId
        );
        return {
          ...product,
          cartItemId: cartItem._id,
        };
      });

      res.send(merged);
    });

    // Delete cart item
    app.delete("/cart/:id", async (req, res) => {
      const id = req.params.id;
      const result = await cartCollection.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) {
        return res.status(404).send({ message: "Item not found" });
      }
      res.send(result);
    });

    // Default route
    app.get("/", (req, res) => {
      res.send("Daily Nook Server is running...");
    });

    // Start server after DB is ready
    app.listen(port, () => {
      console.log(`Daily Nook Server is running on port ${port}`);
    });
  } catch (error) {
    console.log("Error:", error.name, error.message);
  }
}

run();
