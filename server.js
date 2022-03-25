const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require("body-parser")
require('dotenv').config({ path: 'sample.env' });
const mongoose = require('mongoose');
const { Schema } = mongoose;

//membuat skema mongoose dengan database mongodb
const exerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
  userId: String
})

const userSchema = new Schema({
  username: String
})

// pemanggilan middleware
app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.json())
app.use(express.static('public'))
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let Exercise = mongoose.model("Exercise", exerciseSchema);
let User = mongoose.model("User", userSchema);

let count = 0;


// endpoint api user untuk pembuatan user baru
app.post('/api/users', async(req,res) => {

  try{

    const userName = await req.body.username;
    count++;

    let newUser = new User({
      username: userName
      // userId: count
    })

    let myUser = await User.findOne({username: userName})

    if(!myUser){
      await User.create(newUser)

      myUser = await User.findOne({username: userName})

      res.json({
        username: userName,
        _id: myUser._id
      })
    }
    else{
      res.json({error: `User already exists with an Id of ${myUser._id}`})
    }
  }
  catch(err){
    console.log(err)
  }
})

// api endpoint untuk pencarian user
app.get('/api/users', async(req,res) => {
  try{

    await User.find({}, (err,data) => {

      let usersMap = []

      data.forEach(d => usersMap.push({
        username: d.username,
        _id: d._id
      }))

      res.send(usersMap)
    })
  }
  catch(err){
    console.log(err)
  }
})

//api excercise endpoint untuk UserID
app.post('/api/users/:_id/exercises', async(req,res) => {
  try{

    const _id = await req.params;
    const description = await req.body.description;
    const duration = await req.body.duration;
    let date = await req.body.date;
    let currDate = '';
    
    if (!date) {

      currDate = new Date(Date.now());

      let myUser = await User.find({_id: _id})
      
      let newExercise = new Exercise({
        username: myUser[0]._doc.username,
        description: description,
        duration: duration,
        date: currDate.toISOString(),
        userId: myUser[0]._doc._id
      })
      
      await Exercise.create(newExercise)

      res.json({
        username: myUser[0]._doc.username,
        description: description,
        duration: parseInt(duration),
        date: currDate.toDateString(),
        _id: myUser[0]._doc._id
      })
    }
    else {

      currDate = date;

      if (currDate.match(/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/)) {

        let tempDate = currDate.split('-')
        tempDate = new Date(tempDate[0],tempDate[1]-1,tempDate[2])

        let myUser = await User.find({_id: _id})

        let newExercise = new Exercise({
          username: myUser[0]._doc.username,
          description: description,
          duration: duration,
          date: tempDate.toISOString(),
          userId: myUser[0]._doc._id
        })

        await Exercise.create(newExercise)

        res.json({
          username: myUser[0]._doc.username,
          description: description,
          duration: parseInt(duration),
          date: tempDate.toDateString(),
          _id: myUser[0]._doc._id
        })
      }
      else {
        res.json({error: "Invalid Date Format"})
      }
    }
  }
  catch(err){
    console.log(err)
  }
})

//Endpoint untuk logs dari userID
app.get('/api/users/:_id/logs', async(req,res) => {
  try{
    const { from } = await req.query;
    const { to } = await req.query;
    const { limit } = await req.query;
    const _id = await req.params;

    let myUser = await User.find({_id: _id})

    let dateObj = {}

    if(from){
      dateObj["$gte"] = new Date(from).toISOString()
    }
    if(to){
      dateObj["$lte"] = new Date(to).toISOString()
    }

    let filter = {
      userId: myUser[0]._doc._id
    }
    if (from || to){
      filter.date = dateObj
    }

    let myExercise = {}
    if(limit){
      myExercise = await Exercise.find(filter).limit(parseInt(limit))
    }
    else{
      myExercise = await Exercise.find(filter)
    }

    let myLog = []
    myExercise.map(d => myLog.push({
        description: d.description,
        duration: d.duration,
        date: new Date(d.date.split('T')[0].split('-')[0],d.date.split('T')[0].split('-')[1]-1,d.date.split('T')[0].split('-')[2]).toDateString()
      }))

    res.json({
      username: myUser[0]._doc.username,
      count: myExercise.length,
      _id: myUser[0]._doc._id,
      log: myLog
    })
  }
  catch(err){
    console.log(err)
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

exports.UserModel = User;