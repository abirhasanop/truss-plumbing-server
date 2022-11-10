const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require("jsonwebtoken")
const app = express()
const cors = require("cors")
const port = process.env.PORT || 5000
require('dotenv').config()


// midleWare
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vn5qrrb.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: "unauthorized access" })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCES_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "unauthorized acces" })
        }
        req.decoded = decoded
        next()
    })
}


const run = async () => {
    try {
        // Collections
        const serviceCollection = client.db("DbtrussPlumbing").collection("allServices")
        const reviewCollection = client.db("dbReview").collection("allReview")


        // Token
        app.post('/jwt', (req, res) => {
            const user = req.body
            // console.log(user);
            const token = jwt.sign(user, process.env.ACCES_TOKEN_SECRET)
            // console.log({ token });
            res.send({ token })
        })

        // Geting all services from database
        app.get('/services', async (req, res) => {
            const quiry = {}
            const cursor = serviceCollection.find(quiry)
            const result = await cursor.toArray()
            res.send(result)
        })

        // geting limited service from database
        app.get('/limitedServices', async (req, res) => {
            const quiry = {}
            const cursor = serviceCollection.find(quiry).limit(3)
            const result = await cursor.toArray()
            res.send(result)
        })

        // Geting One services from database
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id
            const quiry = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(quiry)
            res.send(service)
        })

        // single service post
        app.post('/services', async (req, res) => {
            const service = req.body
            const result = await serviceCollection.insertOne(service)
            res.send(result)
        })



        // posting review from client site to database
        app.post('/review', async (req, res) => {
            const review = req.body
            const result = await reviewCollection.insertOne(review)
            res.send(result)
        })
        // geting reviews from database
        // app.get('/review', async (req, res) => {
        //     const quiry = {}
        //     const cursor = reviewCollection.find(quiry)
        //     const result = await cursor.toArray()
        //     res.send(result)
        // })


        // Getting Review by email
        app.get('/review', verifyJwt, async (req, res) => {
            // const decoded = req.decoded
            // console.log("Inside Orders Api", decoded);
            // if (decoded.email !== req.query.email) {
            //     res.status(403).send({ message: 'unauthorized' })
            // }


            // console.log(req.query);
            // let query = {
            //     userEmail: req.query.email
            // }

            // console.log(req.headers.authorization);

            let query = {}

            if (req.query.email) {
                query = {
                    userEmail: req.query.email
                }
            }

            const cursor = reviewCollection.find(query).sort({ "date": -1 })
            const review = await cursor.toArray()
            res.send(review)
        })






        app.get('/allreview', async (req, res) => {


            let quiry = {}
            const cursor = reviewCollection.find(quiry).sort({ "date": -1 })
            const result = await cursor.toArray()
            res.send(result)
        })



        // Getting Single Review
        app.get('/review/:id', async (req, res) => {
            const id = req.params.id
            const quiry = { _id: ObjectId(id) }
            const result = await reviewCollection.findOne(quiry)
            res.send(result)
        })


        // Deleting Review
        app.delete('/review/:id', async (req, res) => {
            const id = req.params.id
            const quiry = { _id: ObjectId(id) }
            const result = await reviewCollection.deleteOne(quiry)
            res.send(result)
        })

        // Editing Review: PATCH
        app.patch('/review/:id', async (req, res) => {
            const id = req.params.id
            const quiry = { _id: ObjectId(id) }
            const updatedReview = {
                $set: req.body
            }
            const result = await reviewCollection.updateOne(quiry, updatedReview)
            res.send(result)
        })


    }
    finally {

    }
}
run().catch(err => console.error(err.message))

app.get('/', (req, res) => {
    res.send("Server is running")
})

app.listen(port, () => {
    console.log("Server Running at", port);
})