//jshint esversion:6

//Complete EJS tutorial link on medium.com
//https://medium.com/@Linda_Ikechukwu/https-medium-com-linda-ikechukwu-using-ejs-as-a-template-engine-in-your-express-app-cb3d82c15e17

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

//Express uses jade as its default template engine,so we would have to tell it
// to use ejs instead with the following line to your app.js file in the root
//folder of your project
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Creating a new mongodb database
mongoose.connect("mongodb+srv://admin-gourav:admin-gourav@cluster0.bkutx.mongodb.net/todolistDB");

//Creating a schema for db
const itemsSchema = {
  name: String
}

//Creating a collection based on above schema
const Item = mongoose.model("Item", itemsSchema);

//Creating some default items and inserting those into collection
//using model_name.insertMany(arr, callback_func);
const item1 = new Item({
  name: "Welcome to your todo list!!!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];


// new schema to make dynamic lists
const listSchema = {
  name: String,
  item: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  //finding items using mongoose find method and
  //passing that data to home route using ejs and express
  // we are passing an empty {} to find all items and storing
  //the result of find method in foundItems variable.
  Item.find({}, function (err, foundItems) {
    
    //If there are no items in foundItems then we add defaultItems
    //to database and redirect to home route so we can see the updated
    //list of items
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        }
        else {
          console.log("Successfully added all items");
        }
      });
      res.redirect("/");
    }
    else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });

});

//Custom list page functionality
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name:customListName},function(err, foundList){
    if(!err){
      if(!foundList){
        //Create a new List
        const list = new List({
          name: customListName,
          item: defaultItems
        });
        list.save();  
        res.redirect("/"+ customListName);
      }
      else{
        //Show an existing List
        res.render("list", {listTitle:foundList.name, newListItems: foundList.item});
      }
    }
  });

});



app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name:itemName
  })
  if(listName==="Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name:listName}, function(err, foundList){
      foundList.item.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  //Use this method to remove element from DB and 
  //then redirect to home route
  //We can also use Item.deleteOne(), it's just a
  //matter of personal preference

  if(listName==="Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
        console.log(err);
      }
      else{
        console.log("Successfully removed the checked item");
        res.redirect("/");
      }
    });
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull:{item: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
