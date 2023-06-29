//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash")
// const date = require(__dirname + "/date.js");
// const day = date.getDate();

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {
  useNewUrlParser: true,
});

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("item", itemsSchema);

const item1 = new Item({
  name: "Brush your teeth",
});

const item2 = new Item({
  name: "Drink Coffee",
});

const item3 = new Item({
  name: "Have a bath",
});

let defaultArray = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("list", listSchema);

app.get("/", function (req, res) {
  Item.find().then(function (items) {
    //items is an array
    if (items.length === 0) {
      Item.insertMany([item1, item2, item3]);
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customPath = _.capitalize(req.params.customListName);

  List.findOne({ name: customPath })
    .then(function (foundList) {
      // Below is the value of foundlist. Foundlist has many documents.
      // foundList = {
      //   _id: new ObjectId("644a410bb85ecfde4ae70a04"),
      //   name: 'home',
      //   items: [
      //     {
      //       name: 'Brush your teeth',
      //       _id: new ObjectId("644a407db85ecfde4ae709e9")
      //     },
      //     {
      //       name: 'Drink Coffee',
      //       _id: new ObjectId("644a407db85ecfde4ae709ea")
      //     },
      //     {
      //       name: 'Have a bath',
      //       _id: new ObjectId("644a407db85ecfde4ae709eb")
      //     }
      //   ],
      //   __v: 0
      // }
      // {
      //   _id: new ObjectId("644a411cb85ecfde4ae70a14"),
      //   name: 'favicon.ico',
      //   items: [
      //     {
      //       name: 'Brush your teeth',
      //       _id: new ObjectId("644a407db85ecfde4ae709e9")
      //     },
      //     {
      //       name: 'Drink Coffee',
      //       _id: new ObjectId("644a407db85ecfde4ae709ea")
      //     },
      //     {
      //       name: 'Have a bath',
      //       _id: new ObjectId("644a407db85ecfde4ae709eb")
      //     }
      //   ],
      //   __v: 0
      // }

      if (!foundList) {
        // Create new list
        const list = new List({
          name: customPath,
          items: defaultArray,
        });
        list.save();
        res.redirect("/" + customPath);
      } else {
        // Show list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch((err) => console.log(err));
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then(function (foundList) {
      // Inside lists collection(foundList) look for a document with the name equal to listName,
      // when you found this,whenever user creates new to do item just push the item 
      // inside the items array(based on itemsSchema) and this items array is inside the foundlist document

      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName)

    });
  }
});

app.post("/delete", function (req, res) {
  const itemChecked = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.deleteOne({ _id: itemChecked })
      .then(() => console.log("Successfully deleted"))
      .catch((err) => console.log(err));
    res.redirect("/");
  }
  else {
    List.findOneAndUpdate({name:listName},{$pull: {items: {_id:itemChecked}}}).then(()=>{
      res.redirect("/"+listName)
    }).catch((err)=>
      console.log(err)
    )
  }

});

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

// app.get("/about", function(req, res){
//   res.render("about");
// });

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
