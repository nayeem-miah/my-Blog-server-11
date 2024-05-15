const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
// const cookieParser = require("cookie-parser");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
//middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://my-personal-blog-fcd20.web.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

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
//  middleware
const logger = (req, res, next) => {
  console.log("LOGGED INFFPO", req.method, req.ulr);
  next();
};

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  //  no token available
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ? true: false,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const blogsCollection = client.db("blogsDB").collection("blogs");
    const recentBlogsCollection = client.db("blogsDB").collection("recent");
    const wishListCollection = client.db("blogsDB").collection("wishList");
    const commentCollection = client.db("blogsDB").collection("comment");
    // jwt
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      // console.log("user for ", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.cookie("token", token, cookieOptions).send({ success: true });
    });
    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("log in out ", user);
      res.clearCookie("token", {...cookieOptions, maxAge: 0}).send({ success: true });
    });
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
      // console.log(newBlogs);
      const result = await blogsCollection.insertOne(newBlogs);
      res.send(result);
    });
    //  search and show blogs
    app.get("/blogs", async (req, res) => {
      const search = req.query.search;
      let query = {
        name: { $regex: search, $options: "i" },
      };

      let options = {};
      const result = await blogsCollection.find(query, options).toArray();
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
    // -----------------------------------

    app.get("/featuredBlogs", async (req, res) => {
      const result = await blogsCollection.find().toArray();
      res.send(result);
    });
    // -------------wish list ------------------
    app.post("/wishlist", async (req, res) => {
      const wishlists = req.body;
      // console.log(wishlists);
      delete wishlists._id;
      const result = await wishListCollection.insertOne(wishlists);
      res.send(result);
    });
    app.post("/wishlistRecent", async (req, res) => {
      const wishlistRecentN = req.body;
      // console.log(wishlists);
      delete wishlistRecentN._id;
      const result = await wishListCollection.insertOne(wishlistRecentN);
      res.send(result);
    });

    app.get("/wishlists/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "user.email": email };
      const result = await wishListCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/wishlistRecent/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "user.email": email };
      const result = await wishListCollection.find(query).toArray();
      res.send(result);
    });

    // delete
    app.delete("/wishlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishListCollection.deleteOne(query);
      res.send(result);
    });
    // ----------------------comment collection ---------
    app.post("/comment", async (req, res) => {
      const newComment = req.body;
      const result = await commentCollection.insertOne(newComment);
      res.send(result);
    });
    app.get("/comment", async (req, res) => {
      const result = await commentCollection.find().toArray();
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
