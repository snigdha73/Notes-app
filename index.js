require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const bcrypt = require("bcrypt");
let alert = require('alert'); 
const findOrCreate = require("mongoose-findorcreate");
const jwt = require("jsonwebtoken");
const _= require("lodash");
const date=require(__dirname+"/date.js");
const app=express();
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
mongoose.connect("mongodb://localhost:27017/Notes",{useNewUrlParser:true,  useUnifiedTopology: true,
useFindAndModify: false});
//mongodb+srv://Admin:Admin@cluster0.mq7cb.mongodb.net/todolistDB
const itemsSchema = {
    name: String
};

const userSchema = {
    username: String,
    password: String,
    data: [itemsSchema]
};

const Item = mongoose.model("Item",itemsSchema);

const User = mongoose.model("User",userSchema);

const item1 = new Item({
    name: "Welcome to your todolist"
});

const item2 = new Item({
    name:"Hit the + button to add a new item"
});

const item3 = new Item({
    name:"<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

app.get("/",function(req,res){
    console.log('Request for login');
    res.render("login");
});

app.get('/register', (req, res) => {
    console.log('Request for signup');
    res.render('register');
  });

app.post("/add",function(req,res){

    const itemName=req.body.newItem;
	const item = new Item({
		name: itemName
	});
    const listName = req.body.list;
    const user = listName.split("'")[0];
    User.findOne({username:user},function(err, foundList){
        foundList.data.push(item);
        foundList.save();
        res.render("app",{listTitle:listName,newListItems:foundList.data});
    });
});


app.post("/signup",function(req,res){
    User.findOne({ username: req.body.username }, function (err, found) {
        if (err) {
          console.log(err);
        } else {
          if (found) {
            alert('already registered!');
            res.render("register");
          } else {
            bcrypt.hash(req.body.password, 8, function (err, hash) {
              if (err) {
                console.log(err);
              } else {
                const newUser = new User({
                  username: req.body.username,
                  password: hash,
                  data:defaultItems,
                });
    
                newUser.save(function (err) {
                  if (err) {
                    console.log(err);
                  } else {
                    res.render("app",{listTitle:newUser.username+"'s To Do List",newListItems:newUser.data});
                  }
                });
              }
            });
          }
        }
    });
});

app.post("/log",function(req,res){

    User.findOne({ username: req.body.username, }, function (err, found) {
        if (err) {
          console.log(err);
        } else {
          if (found) {
            console.log(found.password);
            bcrypt.compare(req.body.password, found.password, function (
                err,
                result
              ) {
                if (err) {
                  console.log(err);
                } else {
                  if (result === true) {
                    res.render("app",{listTitle:found.username+"'s To Do List",newListItems:found.data});
                  } else {
                    alert("password not match");
                    res.render("login");
                  }
                }
              });
          }
          else{
            alert("user not found");
            res.render("login");
          }
        }
    });
});

app.post("/delete", function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    const user= listName.split("'")[0];
    User.findOne({ username: user }, function (err, found) {
    if (err){
        console.log(err);
    } else {
        User.findOneAndUpdate({username:user},{$pull: {data:{_id: checkedItemId}}}, function(err, foundList){
            if(err){
                console.log(err);
            }
            });
            User.findOne({ username: user }, function (err, userdata) {
            res.render("app",{listTitle:listName,newListItems:userdata.data});
            });
    }
});
});

let port = process.env.PORT;
if(port == null || port == ""){
    port = 8888;
}
app.listen(port,function(){
    console.log("Server started Successfully");
});