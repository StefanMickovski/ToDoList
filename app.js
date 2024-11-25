const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
    name: "Welcome to your todoList!"
});

const item2 = new Item ({
    name: "Hit the + button to add a new item."
});

const item3 = new Item ({
    name: "<-- Hit this to delete an item.>"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", async function(req, res) {
    try {
        const foundItems = await Item.find({});
        
        if (foundItems.length === 0) {
            await insertDefaultItems();  
            const updatedItems = await Item.find({});  
            res.render("list", { listTitle: "Today", newListItems: updatedItems });
        } else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("Error occurred while fetching items."); 
    }
});

async function insertDefaultItems() {
    try {
        await Item.insertMany(defaultItems);
        console.log("Successfully inserted items in database");
    } catch (err) {
        console.log(err);
    }
};

app.get("/:customListName", async function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    try {
        const foundList = await List.findOne({ name: customListName });

        if (!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems
            });

            await list.save();
            console.log("New list created: " + customListName);
            res.redirect("/" + customListName); 
        } else {
            res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("Error occurred while processing the list.");
    }
});



app.post('/', async function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        try {
            await item.save();
            res.redirect('/'); 
        } catch (err) {
            console.log(err);
            res.status(500).send("Error occurred while saving the item."); 
        }
    } else {
        try {
            const foundList = await List.findOne({ name: listName });
            if (foundList) {
                foundList.items.push(item);
                await foundList.save();
                res.redirect("/" + listName);
            } else {
                res.status(404).send("List not found."); 
            }
        } catch (err) {
            console.log(err);
            res.status(500).send("Error occurred while updating the list."); 
        }
    }
});


app.post("/delete", async function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    try {
        if (listName === "Today") {
            await Item.findByIdAndDelete(checkedItemId);
            console.log("Successfully deleted checked item");
            res.redirect("/");
        } else {
            const foundList = await List.findOneAndUpdate(
                { name: listName },
                { $pull: { items: { _id: checkedItemId } } },
                { new: true } 
            );

            if (foundList) {
                res.redirect("/" + listName);
            } else {
                res.status(404).send("List not found."); 
            }
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("Error occurred while deleting the item."); 
    }
});




app.get("/work", function(req, res){
    res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.post("/work", function(req, res){
    const item = req.body.newItem;
    workItems.push(item);
    res.redirect("/work");
});


app.listen(3000, function(req, res){
    console.log("Server started on port 3000");
});