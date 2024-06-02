const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express()

// middlewars
app.use(express.json());
app.use(
    cors({
        origin: [
            "http://localhost:5173"
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
        await client.connect();

        const dreamDwellings = client.db("dreamDwellings");
        const advertisementsCollection = dreamDwellings.collection("advertisements");
        const reviewsCollection = dreamDwellings.collection("reviews");
        const propertiesCollection = dreamDwellings.collection("properties");
        const wishlistCollection = dreamDwellings.collection("wishlist");
        const offersCollection = dreamDwellings.collection("offers");


        // APIs
        app.get("/advertisements", async (req, res) => {
            const cursor = await advertisementsCollection.find().toArray();
            res.send(cursor)
        })
        app.get("/latest-reviews", async (req, res) => {
            const cursor = await reviewsCollection.find().toArray();
            res.send(cursor)
        })
        app.get("/reviews", async (req, res) => {
            const propertyId = req.query.propertyId
            const query = { property_id: propertyId }
            const cursor = await reviewsCollection.find(query).toArray();
            res.send(cursor)
        })
        app.post("/reviews", async (req, res) => {
            const body = req.body;
            const cursor = await reviewsCollection.insertOne(body);
            res.send(cursor)
        })
        app.get("/properties", async (req, res) => {
            const cursor = await propertiesCollection.find().toArray();
            res.send(cursor)
        })
        app.get("/property-details", async (req, res) => {
            const id = req.query.id
            const query = { _id: new ObjectId(id) }
            const cursor = await propertiesCollection.findOne(query);
            res.send(cursor)
        })
        app.post("/add-to-wishlist", async (req, res) => {
            const body = req.body
            const cursor = await wishlistCollection.insertOne(body)
            res.send(cursor)
        })
        app.get("/wishlists", async (req, res) => {
            const email = req.query.email
            const query = { wishlist_email: email }
            const cursor = await wishlistCollection.find(query).toArray()
            res.send(cursor)
        })
        app.delete("/remove-wishlist", async (req, res) => {
            const id = req.query.id;
            const query = { _id: new ObjectId(id) }
            const cursor = await wishlistCollection.deleteOne(query)
            res.send(cursor)
        })
        app.post("/make-offer", async (req, res) => {
            const body = req.body;
            const cursor = await offersCollection.insertOne(body)
            res.send(cursor)
        })
        app.get("/property-bought", async (req, res) => {
            const email = req.query.email
            const query = { buyer_email: email }
            const cursor = await offersCollection.find(query).toArray()
            res.send(cursor)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
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