// npm i ejs  --> Embedded JavaScript Templating.

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://aditya:aditya@cluster0.cexhh.mongodb.net/todolistDB");

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to Todo List!"
});

const item2 = new Item({
    name: "Hit the + button to add new tasks."
});

const item3 = new Item({
    name: "Check off your completed tasks."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);
  
app.get("/", function (req, res) {

    Item.find({}, function(err, foundItems){
        // Save default items only when list is empty
        if(foundItems.length == 0){
            Item.insertMany(defaultItems, function(err){
                if(err)
                console.log(err);
            
                else
                console.log("Saved default tasks to DB");
            });
            res.redirect("/");
        }

        else
        res.render("list", {listTitle: "Today", newListItems: foundItems});
    });
});

// Create custom pages
app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
        if(!err){
            if(!foundList){
                // create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/"+ customListName);
            }
            else{
                // Show existing list 
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items} )
            }
        }
    })
    

    
})

app.post("/", function(req, res){
     const itemName = req.body.newItem;
     const listName = req.body.list;

     let item = new Item({
         name: itemName
     });

    if(listName === "Today"){
        item.save(); 
        res.redirect("/");
    }
    else{
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(!err){
                console.log("Deleted checked item");
                res.redirect("/");  
            }
        });
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
            if(!err){
                res.redirect("/" + listName);
            }
        });
    }
});



app.listen(3000, function () {
    console.log("Server started on port 3000");
});
