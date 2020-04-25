const mongoose = require("mongoose");

mongoose.connect('mongodb+srv://re4lawliet:01123581321fish@cluster0-gvsne.mongodb.net/bd2?retryWrites=true&w=majority',{
    
    useNewUrlParser: true,
    useUnifiedTopology: true,
    
    useCreateIndex: true,
    useFindAndModify: false
    
})
  .then(db => console.log("Base de Datos Conectada"))
  .catch(err => console.error(err));