const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
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


        // APIs
        app.get("/advertisements", async (req, res) => {
            const cursor = await advertisementsCollection.find().toArray();
            res.send(cursor)
        })
        app.get("/reviews", async (req, res) => {
            const cursor = await reviewsCollection.find().toArray();
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