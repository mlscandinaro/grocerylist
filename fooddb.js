/******************
fooddb.js
comp 20 final
maya scandinaro 
4/23/20  
******************/

const http = require('http');
const url = require('url');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;  
const mongoUrl = "mongodb+srv://mlscandinaro:7Grry9bNULoaYcrK@cluster0-fdofm.mongodb.net/test?retryWrites=true&w=majority";
var port = process.env.PORT || 3000;  

// log in info
var loggedIn = false;
var user;

// grocery list info
var list;

fs.readFile('./index.html', function (err,html) {
	if (err) {
		throw err;
	}
	http.createServer(function(req,res) {
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write(html);

		// food info from url
		var qobj = url.parse(req.url, true).query
		var clear = qobj.clear;
		var print = qobj.print;
		var item = qobj.search;
		var foodName = item + "";

		// login info from url
		var username = qobj.username;
		var password = qobj.psswd;

		// if user pressed sign up button
		var signUp = qobj.signUpBttn;
		if (signUp != null) {
			console.log("PRESSED SIGN UP");
			if (username != null && password != null && username.length > 0 && password.length > 0) {
				checkSignUp(username, password);
				res.write("<script type='text/javascript'>alert('If sign up was succesful, you can now log in.");
				res.write(" Otherwise, the username you requested may already be taken.');</script>");
			} else {
				res.write("<script type='text/javascript'>alert('Fill in both username and password.');</script>");
			}
		}
		
		// if user pressed log in button
		var logIn = qobj.logBttn;
		if (logIn != null) {
			console.log("PRESSED LOG IN");
			if (username != null && password != null && username.length > 0 && password.length > 0) {
				logInUser(username, password);
				res.write("<script type='text/javascript'>alert('If log in was successful, you can add items and print list.");
				res.write(" Otherwise, credentials may be incorrect, or you havent signed up yet.');</script>");
			} else {
				res.write("<script type='text/javascript'>alert('Fill in both username and password.');</script>");
			}
		}

		var logOut = qobj.logOutBttn;
		if (logOut != null) {
			loggedIn = false;
			res.write("<script type='text/javascript'>alert('Logging out complete.');</script>");
		}

		// if logged in, adds item, else get alert
		if (foodName.length > 0 && item != null && loggedIn && print == null) {
			addItem(item);
		} else if (item != null && print == null && !loggedIn && clear == null) {
			res.write("<script type='text/javascript'>alert('Please sign up or log in to add item.');</script>");
		}

		// if logged in, prints list, else get alert
		if (loggedIn && print != null && list !=null) {
			res.write("<div class='container'>");
			res.write("<br><section class='section' style='padding:20px 20px 20px 20px;text-align:center;'>");
			res.write("<h2 class='section-subheader' style='color:#75482E'><b>YOUR CART</b></h2>");
			res.write("<div class='box' id='groceries' style='text-align:center;'>");
			res.write("<table style='background-color:white; width:100%'>");
			res.write("<tr><th>Items</th></tr>");
			for (i = 0; i < list.length; i++) {
				if (list[i].food.length > 0) {
					res.write("<tr><td>" + list[i].food + "</td></tr>");
				}	
			}
			res.write("</table></div>");
			res.write("</section>")
			res.write("</div>");
		} else if (!loggedIn && print !=null) {
			res.write("<script type='text/javascript'>alert('Please sign up or log in to print list.');</script>");
		}

		if (loggedIn && clear != null) {
			clearList();
		} else if (!loggedIn && clear != null) {
			res.write("<script type='text/javascript'>alert('Please sign up or log in to clear list.');</script>");
		}

		res.end();
	}).listen(port);
});

// purpose: adds food to database and its associated username
function addItem(foodToAdd) {
	MongoClient.connect(mongoUrl,{useUnifiedTopology:true},function(err, db) {  
		if (err) {
			return console.log(err);
		} 
		var dbo = db.db("comp20final");
		var collection = dbo.collection("groceries");
		var newData = { "username": user, "food": foodToAdd}; 
		collection.insertOne(newData, function(err,res) {
			if (err) {
				return console.log(err);
			}
		});
		console.log("ADDED " + foodToAdd);
		collection.find({"username":user}).toArray(function(err,items) {
			if (err) {
				return console.log(err);
			} else {
				list = items;
				console.log("updated list - " + list.length + " items");
			}
		});	
	});
}

// purpose: checks if user is signed up already
function checkSignUp(username, password) {
	MongoClient.connect(mongoUrl,{useUnifiedTopology:true},function(err, db) {  
		if (err) {
			return console.log(err);
		} 
		var dbo = db.db("comp20final");
		var collection = dbo.collection("login");
		collection.find({"username":username}).toArray(function(err,items) {
			if (err) {
				return console.log(err);
			} else {
				if (items.length > 0) {
					console.log("Failed to sign up. Username taken.");
				} else {
					signUp(username, password);
				}
			}
		});
	});
}

// purpose: signs up user if not already in database
function signUp(username, password) {
	MongoClient.connect(mongoUrl,{useUnifiedTopology:true},function(err, db) {  
		if (err) {
			return console.log(err);
		} 
		var dbo = db.db("comp20final");
		var collection = dbo.collection("login");
		var newData = { "username": username, "password": password}; 
		collection.insertOne(newData, function(err,res) {
			if (err) {
				return console.log(err);
			}
		});
		console.log("ADDED NEW USER: " + username + " " + password);
	});
}

// purpose: checks login credentials and logs user in if in database
function logInUser(username, password) {
	MongoClient.connect(mongoUrl,{useUnifiedTopology:true},function(err, db) {  
		if (err) {
			return console.log(err);
		} 
		var dbo = db.db("comp20final");
		var collection = dbo.collection("login");
		collection.find({"username":username}).toArray(function(err,items) {
			if (err) {
				return console.log(err);
			} else {
				if (items.length > 0) {
					if (items[0].password == password) {
						loggedIn = true;
						user = username;
						console.log("Successful login! Welcome, " + username);
						addItem("");
					}
				} else {
					loggedIn = false;
					console.log("Unable to find user. Please retype credentials or sign up.");
				}
			}
		});
	});
}

// purpose: clear the grocery list for the logged in user
function clearList() {
	MongoClient.connect(mongoUrl,{useUnifiedTopology:true},function(err, db) {  
		if (err) {
			return console.log(err);
		} 
		var dbo = db.db("comp20final");
		var collection = dbo.collection("groceries");
		collection.deleteMany({"username":user}); 
		collection.find({"username":user}).toArray(function(err,items) {
			if (err) {
				return console.log(err);
			} else {
				list = items;
				console.log("CLEARED LIST");
			}
		});
	});
}


