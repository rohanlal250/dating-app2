const PORT = 8000;
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://anandhu:@cluster0.mubkbpi.mongodb.net/Cluster0?retryWrites=true&w=majority";


const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  console.log("HOME");
});

app.post("/signup", async (req, res) => {
  const client = new MongoClient(uri);
  const { email, password } = req.body;
  const newEmail = email.toLowerCase();

  const generatedUserId = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await client.connect();
    const database = client.db("app-data");
    const users = database.collection("user-data");

    const exisitingUser = await users.findOne({ newEmail });
    if (exisitingUser) {
      return res.status(409).send("user already exists");
    }

    const data = {
      user_id: generatedUserId,
      email: newEmail,
      hashed_password: hashedPassword,
    };

    const insertedUser = await users.insertOne(data);

    const token = jwt.sign(insertedUser, newEmail, {
      expiresIn: 60 * 24,
    });

    res.status(201).json({ token, userId: generatedUserId });
  } catch (err) {
    console.log(err.message);
  }
});

app.post("/login", async (req, res) => {
  const client = new MongoClient(uri);
  const { email, password } = req.body;
  const newEmail = email.toLowerCase();

  try {
    await client.connect();
    const database = client.db("app-data");
    const users = database.collection("user-data");

    const user = users.findOne({ newEmail });
    if (user && (await bcrypt.compare(password, user.hashed_password))) {
      const token = jwt.sign(user, email, {
        expiresIn: 60 * 24,
      });

      res.status(201).json({ token, userId: user.user_id });
    }

    res.status(400).send("Invalid credentials");
  } catch (err) {
    console.log(err.message);
  }
});

app.get("/users", async (req, res) => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db("app-data");
    const users = database.collection("user-data");

    const returnedUsers = await users.find().toArray((err, result) => {
      if (err) throw err;
      console.log(result);
    });
    res.send(returnedUsers);
  } catch (err) {
    console.log(err.message);
    // await client.close();
  }
});

app.post("/user", async (req, res) => {
  const client = new MongoClient(uri);
  const formData = req.body.formData;

  try {
    await client.connect();
    const database = client.db("app-data");
    const users = database.collection("user-data");

    const query = { user_id: formData.user_id };
  } catch (err) {
    console.error(err.message);
  }
});

app.listen(PORT, () => {
  console.log("Server listening on port ", PORT);
});
