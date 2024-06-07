const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express()
const stripe = Stripe('sk_test_51PNIg408T0MNCRXmytzq8V4Toky8wJoie2IMT1aJ08xSzHKWbks8GuA4wLoCJfQlx0JL9JTqYssxe8grbqQrk5rj000Lyh627E');

// middlewars
app.use(express.json());
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://dream-dwellings-36ef2.web.app",
            "https://dream-dwellings-36ef2.firebaseapp.com"
        ],
        credentials: true,
    })
);


const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster2.n2vc9uo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster2`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const dreamDwellings = client.db("dreamDwellings");
        const usersCollection = dreamDwellings.collection("users");
        const advertisementsCollection = dreamDwellings.collection("advertisements");
        const reviewsCollection = dreamDwellings.collection("reviews");
        const propertiesCollection = dreamDwellings.collection("properties");
        const wishlistCollection = dreamDwellings.collection("wishlist");
        const offersCollection = dreamDwellings.collection("offers");

        // JWT APIs
        app.post("/jwt", (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
            res.send({ token });
        })
        // JWT middlewar
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = req.headers.authorization;
            jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded;
                next();
            })
        }

        // APIs
        app.get("/users", verifyToken, async (req, res) => {
            const email = req.query.email;
            const cursor = await usersCollection.find().toArray();
            const result = cursor.filter(user => user.email !== email);
            res.send(result);
        })
        app.get("/fraud-users", async (req, res) => {
            const query = { is_fraud: "fraud", role: "agent" }
            const cursor = await usersCollection.find(query).toArray();
            res.send(cursor);
        })
        app.patch("/users", verifyToken, async (req, res) => {
            const id = req.query.id;
            const body = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: body.role,
                }
            }
            const options = { upsert: true };
            const cursor = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(cursor);
        })
        app.post("/users", async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const isUser = await usersCollection.findOne(query);
            if (isUser) {
                res.send({ message: "user already exist" });
                return
            }
            const cursor = await usersCollection.insertOne(user);
            res.send(cursor);
        })
        app.delete("/users", verifyToken, async (req, res) => {
            const id = req.query.id;
            const query = { _id: new ObjectId(id) }
            const cursor = await usersCollection.deleteOne(query);
            res.send(cursor);
        })
        app.get("/user", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = await usersCollection.findOne(query);
            res.send(cursor);
        })
        app.get("/advertisements", async (req, res) => {
            const cursor = await advertisementsCollection.find().toArray();
            res.send(cursor)
        })
        app.post("/advertisements", async (req, res) => {
            const body = req.body;
            const cursor = await advertisementsCollection.insertOne(body);
            res.send(cursor)
        })
        app.get("/latest-reviews", async (req, res) => {
            const cursor = await reviewsCollection.find().sort({ _id: -1 }).limit(3).toArray();
            res.send(cursor)
        })
        app.get("/all-reviews", verifyToken, async (req, res) => {
            const cursor = await reviewsCollection.find().toArray();
            res.send(cursor)
        })
        app.delete("/delete-reviews", verifyToken, async (req, res) => {
            const id = req.query.id;
            const query = { _id: new ObjectId(id) };
            const cursor = await reviewsCollection.deleteOne(query);
            res.send(cursor)
        })
        app.get("/reviews", verifyToken, async (req, res) => {
            const propertyId = req.query.propertyId
            const query = { property_id: propertyId }
            const cursor = await reviewsCollection.find(query).toArray();
            res.send(cursor)
        })
        app.post("/reviews", verifyToken, async (req, res) => {
            const body = req.body;
            const cursor = await reviewsCollection.insertOne(body);
            res.send(cursor)
        })
        app.get("/my-reviews", verifyToken, async (req, res) => {
            const email = req.query.email
            const query = { reviewer_email: email }
            const cursor = await reviewsCollection.find(query).toArray();
            res.send(cursor)
        })
        app.delete("/my-reviews", verifyToken, async (req, res) => {
            const id = req.query.id;
            const query = { _id: new ObjectId(id) }
            const cursor = await reviewsCollection.deleteOne(query);
            res.send(cursor)
        })
        app.get("/properties", verifyToken, async (req, res) => {
            const cursor = await propertiesCollection.find().toArray();
            res.send(cursor)
        })
        app.post("/properties", verifyToken, async (req, res) => {
            const body = req.body;
            const cursor = await propertiesCollection.insertOne(body);
            res.send(cursor)
        })
        app.delete("/properties", verifyToken, async (req, res) => {
            const id = req.query.id;
            const query = { _id: new ObjectId(id) };
            const cursor = await propertiesCollection.deleteOne(query);
            res.send(cursor)
        })
        app.patch("/properties", verifyToken, async (req, res) => {
            const id = req.query.id
            const body = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    property_title: body.property_title,
                    property_location: body.property_location,
                    price_range: body.price_range,
                    property_image: body.property_image,
                },
            };
            const cursor = await propertiesCollection.updateOne(filter, updateDoc);
            res.send(cursor)
        })
        app.get("/verified-properties", async (req, res) => {
            const filter = { verification_status: "verified" }
            const cursor = await propertiesCollection.find(filter).toArray();
            res.send(cursor)
        })
        app.get("/verified-properties-search", async (req, res) => {
            const text = req.query.text;
            const query = { verification_status: "verified", property_location: { $regex: text, $options: 'i' } };
            const cursor = await propertiesCollection.find(query).toArray();
            res.send(cursor)
        })
        app.get("/my-added-properties", verifyToken, async (req, res) => {
            const email = req.query.email;
            const query = { agent_email: email };
            const cursor = await propertiesCollection.find(query).toArray();
            res.send(cursor)
        })
        app.get("/my-sold-properties", verifyToken, async (req, res) => {
            const email = req.query.email;
            const query = { agent_email: email, verification_status: "bought" };
            const cursor = await offersCollection.find(query).toArray();
            res.send(cursor)
        })
        app.get("/requested-properties", verifyToken, async (req, res) => {
            const email = req.query.email;
            const query = { agent_email: email };
            const cursor = await offersCollection.find(query).toArray();
            res.send(cursor)
        })
        app.get("/property-details", verifyToken, async (req, res) => {
            const id = req.query.id
            const query = { _id: new ObjectId(id) }
            const cursor = await propertiesCollection.findOne(query);
            res.send(cursor)
        })
        app.patch("/property-details", verifyToken, async (req, res) => {
            const id = req.query.id;
            const body = req.body;
            const query = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    verification_status: body.verification_status
                }
            }
            const cursor = await propertiesCollection.updateOne(query, updateDoc);
            res.send(cursor)
        })
        app.post("/add-to-wishlist", verifyToken, async (req, res) => {
            const body = req.body
            const cursor = await wishlistCollection.insertOne(body)
            res.send(cursor)
        })
        app.get("/wishlists", verifyToken, async (req, res) => {
            const email = req.query.email
            const query = { wishlist_email: email }
            const cursor = await wishlistCollection.find(query).toArray()
            res.send(cursor)
        })
        app.delete("/remove-wishlist", verifyToken, async (req, res) => {
            const id = req.query.id;
            const query = { _id: new ObjectId(id) }
            const cursor = await wishlistCollection.deleteOne(query)
            res.send(cursor)
        })
        app.post("/make-offer", verifyToken, async (req, res) => {
            const body = req.body;
            const cursor = await offersCollection.insertOne(body)
            res.send(cursor)
        })
        app.get("/property-bought", verifyToken, async (req, res) => {
            const email = req.query.email
            const query = { buyer_email: email }
            const cursor = await offersCollection.find(query).toArray()
            res.send(cursor)
        })
        app.get("/single-property-bought", verifyToken, async (req, res) => {
            const id = req.query.id
            const query = { _id: new ObjectId(id) }
            const cursor = await offersCollection.findOne(query)
            res.send(cursor)
        })
        app.put("/single-property-bought", verifyToken, async (req, res) => {
            const id = req.query.id
            const body = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    verification_status: "bought",
                    transaction_id: body.transaction_id
                },
            };
            const options = { upsert: true };

            const cursor = await offersCollection.updateOne(filter, updateDoc, options)
            res.send(cursor)
        })
        app.patch("/accept-property", verifyToken, async (req, res) => {
            const id = req.query.id;
            const body = req.body;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    verification_status: body.verification_status,
                }
            }
            const cursor = await offersCollection.updateOne(filter, updateDoc);
            res.send(cursor);
        })
        app.patch("/reject-property", verifyToken, async (req, res) => {
            const id = req.query.id;
            const body = req.body;
            const filter = { property_id: id }
            const updateDoc = {
                $set: {
                    verification_status: body.verification_status,
                }
            }
            const cursor = await offersCollection.updateMany(filter, updateDoc);
            res.send(cursor);
        })
        app.post('/payment', verifyToken, async (req, res) => {
            const { amount } = req.body;
            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency: 'usd',
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
            });
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Dream Dwellings is running")
})
app.listen(port, () => {
    console.log(`Drem Dwelling is running at: http://localhost:${port}`)
})