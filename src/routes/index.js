const express = require('express');
const router =  express.Router();

//Funcion que maneja las peticiones y respuestas
router.get('/', (req, res) => {
    res.render('index.hbs');
});

//otra forma de la funcion
router.get('/about', function(req, res){
    res.render('about');
});

module.exports = router;