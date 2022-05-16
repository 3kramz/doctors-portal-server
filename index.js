const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@services.fotqy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db('docors_portal').collection('services');
    const bookingCollection = client.db('docors_portal').collection('booking');
    const userCollection = client.db('docors_portal').collection('users');

    app.get('/service', async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();

      res.send(services);
    })


    app.get("/available", async (req, res) => {
      const date = req.query.date
      const services = await serviceCollection.find().toArray()
      const query = { date }
      const bookings = await bookingCollection.find(query).toArray()

      services.forEach(service => {
        const bookedServices = bookings.filter(book => book.treatmentName === service.name)
        const bookedSlot = bookedServices.map(s => s.slot)

        service.slots = service.slots.filter(slot => !bookedSlot.includes(slot))
      })
      res.send(services)
    })


    app.get('/booking', async (req, res) => {
      const email = req.query.email
      const query = { email }
      const bookings = await bookingCollection.find(query).toArray()
      res.send(bookings)
    })

    app.post('/booking', async (req, res) => {
      const booking = req.body
      const query = { date: booking.date, treatmentName: booking.treatmentName, patientname: booking.patientname }

      const exist = await bookingCollection.findOne(query)
      if (exist) {
        return res.send({ success: false, booking: exist })
      }

      const result = await bookingCollection.insertOne(booking)
      res.send({ success: true, result });
    })

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email
      const user = req.body
      const filter = { email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ foo: 'bar' }, process.env.SECRET_ACCESS_TOKEN);

      res.send({result,token})



    })


  }
  finally {

  }
}

run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Doctors portall is running..')
})

app.listen(port, () => {
  console.log(`Doctors App listening on port ${port}`)
})