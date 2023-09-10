const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dbKey = process.env['DB_KEY'];
mongoose.connect(dbKey,{useNewUrlParser : true, useUnifiedTopology : true});
app.use(bodyParser.urlencoded({extended : false}));
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
//check db connection
mongoose.connection.on('error', console.error.bind(console, 'connection error'));
mongoose.connection.once('open', () => {
  console.log('successfully mongoose to mongo')
});
//mongoose model 
const Schema = mongoose.Schema;
const userSchema = new Schema ({
  username : {
    type : String,
    required : true,
  }
});
const exerciseSchema = new Schema({
  userId : {
    type : String,
    require : true,
  },
  username : {
    type : String,
  },
  description : {
    type : String, 
    require : true,
  },
  duration : {
    type : Number,
    require : true,
  },
  date : {
    type : String
  }
})
//create model
const User = new mongoose.model('User', userSchema);
const Exercise = new mongoose.model('Exercise', exerciseSchema);

//user form with post method
app.post('/api/users', async (req, res) => {
  const userName = req.body.username;
  const checkUser = await User.findOne({username : userName});
  if(checkUser){
    res.json(checkUser)
  }else{
    const newUser = new User({
      username : userName,
    })
    await newUser.save();
    res.json(newUser);
  }
});
//get method to show all user list
app.get('/api/users/',  async (req, res) => {
  const findAll = await User.find({})
      .then((foundData) => {
        res.json(foundData)
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({error : "Internal Server Error"})
      })
})

//add exercise to Exercise model
app.post('/api/users/:_id/exercises', async (req, res) => {
  const getUserId = req.params._id;
  const getDescription = req.body.description;
  const getDuration = req.body.duration;
  const getDate = req.body.date;
  //validate the date
  let date;
  if(!getDate){
    date = new Date().toDateString();
  }else{
    if(!isNaN(getDate)){
      date = new Date(parseInt(getDate)).toDateString();
    }else{
      date = new Date(getDate).toDateString();
    }
  }

  //find the user with id in user table
  try{
      const foundOne = await User.findById(getUserId);
  if(!foundOne){
    res.json({error : "there is no such user related to this Id."})
  }else{
    const newExercise = new Exercise({
      userId : foundOne._id,
      username : foundOne.username,
      description : getDescription,
      duration : getDuration,
      date : date,
    })
    await newExercise.save();
    res.json({
      _id : newExercise.userId,
      username : newExercise.username, 
      description : newExercise.description,
      duration : newExercise.duration,
      date : newExercise.date
    });
  }
  }catch(error){
    console.log(error)
    res.status(500).json({error : "Internal Server Error"})
  }
})

//user log
app.get('/api/users/:_id/logs', async (req, res) => {
  const getId = req.params._id;
  let {from, to, limit} = req.query;
  try{
      const findUser = await User.findById(getId);
      if(!findUser){
        res.json({error : "there is no user with given id"})
      }
      let findExercise = await Exercise.find({userId : findUser._id}).select('-_id description duration date');
    //filter only for from
      if(from && !to){
        to = new Date().toDateString();
        findExercise = findExercise.filter(exercise => {
        const exerciseDate = new Date(exercise.date);
        const fromDate = new Date(from);
        const toDate = new Date(to);
        return exerciseDate >= fromDate && exerciseDate <= toDate;
      })
        if(limit){
          findExercise = findExercise.slice(0, limit)
        }
        res.json({
        _id : findUser._id,
        username : findUser.username,
        from : new Date(from).toDateString(),
        count : findExercise.length,
        log : findExercise,
        })
      }
    //filter only for to 
    if(!from && to){
      from = new Date(0).toDateString();
      findExercise = findExercise.filter(exercise => {
        const exerciseDate = new Date(exercise.date);
        const fromDate = new Date(from);
        const toDate = new Date(to);
        return exerciseDate >= fromDate && exerciseDate <= toDate;
      })
        if(limit){
          findExercise = findExercise.slice(0, limit)
        }
        res.json({
        _id : findUser._id,
        username : findUser.username,
        to : new Date(to).toDateString(),
        count : findExercise.length,
        log : findExercise,
    })
    }

    //without filters
    if(limit){
      findExercise = findExercise.slice(0, limit);
    }
    res.json({
        _id : findUser._id,
        username : findUser.username,
        count : findExercise.length,
        log : findExercise,
        })
  }catch(error){
    console.log(error)
    res.status(500).json({error : "Internal Server Error"})
  }
  
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
