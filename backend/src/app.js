const express =require("express")
const path = require('path')

const app = express();
app.use(express.static(path.join(__dirname,'../public')));

app.get("/",(req,res)=>{
    res.send("hello world")
})

app.get("name",(req,res)=>{
    res.sendFile(this.path.join(__dirname, '../public/index.html'))
})
module.exports = app;