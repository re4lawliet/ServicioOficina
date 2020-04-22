// URLS De autenticacion de usuario
const express = require('express');
const router =  express.Router();

const User = require('../models/User');
const passport=require('passport');
const { isAuthenticated } = require('../helpers/auth');

router.get('/users/login', function(req, res){
    res.render('users/login.hbs');
});

router.post('/users/login', passport.authenticate('local', {
    successRedirect: "/admin/home_admin",
    failureRedirect: "/users/login",
    failureFlash: true
}));

router.get('/users/logout', function(req, res){
    req.logOut();
    res.render('index.hbs');
});

router.get('/users/form_registro', function(req, res){
    res.render('users/registro.hbs');
});

router.post('/users/registro', async(req, res) => {
    
    const{ name, email, password, confirm_password } = req.body;
    const errors=[];

    if(password != confirm_password){
        errors.push({text:'Contraseña no coincide'});
    }
    if(password.length < 4){
        errors.push({text:'La contraseña debe ser mayor que 4 caracteres',});
    }

    if(errors.length>0){
        res.render('users/registro.hbs', {
            errors
        });
    }else{
        
        const emailuser=await User.findOne({email: email});
        
        if(emailuser){
            errors.push({text:'El Usuario ya esta en Uso',});
            res.render('users/registro.hbs', {errors});
        }else{
            const newuser = new User({ name, email, password });
            newuser.password = await newuser.encryptPassword(password);
            await newuser.save();
            req.flash('succes_msg', 'User Agregado con Exito');
            res.render('users/login.hbs');
        }
        
    }
});

router.get('/admin/home_admin', isAuthenticated, function(req, res){
    res.render('users/homeAdmin.hbs');
});




module.exports = router;