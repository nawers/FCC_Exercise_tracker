// myApp.js
// Exercise Tracker

const express = require('express');
const bodyParser = require("body-parser");
const app = express();

//Use body-parser to Parse POST Requests
app.use(bodyParser.urlencoded({ extended: false }))

//Store all users (and prevent duplicata?)
//i'm guessing that it could be stored in goosedb or smth
let usersDatabase = {};

//generate a random ID 
function generateID() {
  let shortID;
  do {
    shortID = (new Date()).getTime().toString(24) + Math.random().toString(24).slice(2)
  } while (usersDatabase[shortID]);
  return shortID;
}
//this one create a new users
//THIS ONE SHOULD WORKS
app.post('/api/users', (req, res) => {
    const userNameInput = req.body.username;
    const userId = generateID()
	
// Store user
	usersDatabase[userId] = {
		username: userNameInput,
		count: 0,
		_id: userId,
		log: []
	};

    res.json({
            username: userNameInput,
            _id: userId    
    });
});

//this one below need to returns an array container username and id
//You can make a GET request to /api/users to get a list of all users.
app.get('/api/users', (req, res) => {
  const userList = Object.values(usersDatabase).map(user => ({
    username: user.username,
    _id: user._id
  }));
  res.json(userList);
});

//post to see below with form data description, duration and optionnaly date
//The response returned from POST /api/users/:_id/exercises will be the user object with the exercise fields added.
app.post('/api/users/:_id/exercises', (req, res) => {
    const userId = req.params._id;
	const user = usersDatabase[userId];
	
	if (!user) {
    return res.status(404).json({ error: "User not found" });
	}

	// handle description and force it to be a string
    const description = req.body.description;
    if (!description || typeof description !== 'string') {
        return res.status(400).json({ error: "Description is required" });
    }


    // handle duration and check if it's a positive number
	const duration = parseInt(req.body.duration);
    if (isNaN(duration) || duration <= 0) {
        return res.status(400).json({ error: "Duration must be a positive number" });
    }


	let date = req.body.date ? new Date(req.body.date) : new Date();

    if (req.body.date && isNaN(date.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
    }
    const formattedDate = date.toDateString();
    
	const exercise = {
		description,
		duration,
		date: formattedDate
	};

	// add info into the semi database and count number of exercice
	user.log.push(exercise);
	user.count++;
	
    res.json({
		_id: user._id,
		username: user.username,
		date: exercise.date,
		duration: exercise.duration,
		description: exercise.description
	});
});

//You can make a GET request to /api/users/:_id/logs to retrieve a full exercise log of any user.
//You can add from, to and limit parameters to a GET /api/users/:_id/logs request to retrieve part of the log of any user. 
//from and to are dates in yyyy-mm-dd format. 
//limit is an integer of how many logs to send back.
app.get('/api/users/:_id/logs', (req, res) => {
	const userId = req.params._id;
	const user = usersDatabase[userId];
	
	if (!user) {
    return res.status(404).json({ error: "User not found" });
	}
	//let's go with the optionnal
	let logs = [...user.log];
	let from = req.query.from;
	let to = req.query.to;
	let limit = req.query.limit;
	
	// Filter by from
	if (from) {
		const fromDate = new Date(from);
		if (!isNaN(fromDate)) {
			logs = logs.filter(e => new Date(e.date) >= fromDate);
		}
	}
	
	// Filter by to
	if (to) {
		const toDate = new Date(to);
		if (!isNaN(toDate)) {
			logs = logs.filter(e => new Date(e.date) <= toDate);
		}
	}
	
	// Apply limit 
	if (limit) {
		limit = parseInt(limit);
		if (!isNaN(limit)) {
			logs = logs.slice(0, limit);
		}
	}
	
  
	res.json({
        _id: user._id,
        username: user.username,
        count: logs.length,
        log: logs
    });
});

 module.exports = app;
