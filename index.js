const express = require("express");
const cors = require("cors");
// const jwt = require("jsonwebtoken");
// const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
//middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
// app.use(cookieParser());
// console.log(process.env.DB_NAME);
// console.log(process.env.DB_PASS);
// ----------------------------------------------

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.bomlehy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const blogsCollection = client.db("blogsDB").collection("blogs");
    const recentBlogsCollection = client.db("blogsDB").collection("recent");

    // recent blogs
    app.get("/recent", async (req, res) => {
      const result = await recentBlogsCollection.find().toArray();
      res.send(result);
    });
    app.get("/recentDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await recentBlogsCollection.findOne(query);
      res.send(result);
    });

    app.post("/blogs", async (req, res) => {
      const newBlogs = req.body;
      console.log(newBlogs);
      const result = await blogsCollection.insertOne(newBlogs);
      res.send(result);
    });
    app.get("/blogs", async (req, res) => {
      const result = await blogsCollection.find().toArray();
      res.send(result);
    });
    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogsCollection.findOne(query);
      res.send(result);
    });
    // ------------update--------------
    app.get("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogsCollection.findOne(query);
      res.send(result);
    });
    app.put("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedBlogs = req.body;
      const blogs = {
        $set: {
          image: updatedBlogs.image,
          shortDescription: updatedBlogs.shortDescription,
          category: updatedBlogs.category,
          name: updatedBlogs.name,
          email: updatedBlogs.email,
          description: updatedBlogs.description,
        },
      };
      const result = await blogsCollection.updateOne(filter, blogs, options);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// --------------------------------------------------

app.get("/", (req, res) => {
  res.send("My BlogIng server is Running");
});
app.listen(port, () => {
  console.log(`My BlogIng server is Running on port ${port}`);
});
