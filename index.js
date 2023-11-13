const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken")
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 8080;

// middle wares

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_SECRETKEY}@cluster0.w4va0jw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
function verifyJWT(req, res, next){
  const authHeader = req.headers.authentication;
  if(!authHeader){
    res.status(401).send({message:'unauthorised access' })
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_TOCKEN, function(err, decoded){
    if(err){
      res.status(403).send({message:'unauthorised access' })
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const serviceCollection = client.db('paradiseSalon').collection('services');
    const reviewCollection = client.db('paradiseSalon').collection('reviews');

    app.get('/services', async (req, res) => {
        const query = {}
        const cursor = serviceCollection.find(query);
        const services = await cursor.toArray();
        res.send(services);
    })
    app.get('/serviceDetails/:id', async (req, res) => {
      const id = req.params.id;
      const query1 = { _id: new ObjectId(`${id}`) };
      const query2 = {serviceId:id}
      const service = await serviceCollection.findOne(query1);
      const cursor = reviewCollection.find(query2);
      const reviews = await cursor.toArray();
      res.send({service, reviews });

    })
    app.get('/updatereview/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(`${id}`)}
        const rewiew = await reviewCollection.findOne(query);
        res.send(rewiew);
    })
    app.put('/updatedreview/:id',async(req, res)=>{
        const id = req.params.id;
        const filter = {_id: new ObjectId(`${id}`)}
        const updateDoc = {
          $set:{addedReview : req.body.addedReview},
        }
        const options = { upsert: true };
        const result = await reviewCollection.updateOne(filter, updateDoc, options);
        res.send(result);
    })
    app.delete('/remove/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(`${id}`) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    })
    app.get('/userReview',verifyJWT, async(req, res) => {
      const email = req.decoded
      
      let query = {}
      if(email !== email){
        res.status(403).send({message: 'Forbidden Access'})
      }
      if(req.query.email){
        query = {
          email: req.query.email
        }
      }
    
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    })
    app.post('/addService', async(req, res) => {

      const service_id =await serviceCollection.countDocuments();
      const newService = req.body;
      newService.service_id = `${service_id+1}`;

      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    })
    app.post('/reviews', async(req, res) => {
        const user = req.body.email;
        const token = jwt.sign(user, process.env.JWT_TOCKEN) 
        const review = req.body;
        const result = await reviewCollection.insertOne(review);
        res.send({result,token });

    })

  }
  finally{
    
  }
}
run().catch((error) => console.error(error));


app.get('/', (req, res) =>{
    res.send('Paradise Salon is Running')

})
app.listen(port, ()=>{
    console.log(`Paradise Salon Running on ${port}`)
})