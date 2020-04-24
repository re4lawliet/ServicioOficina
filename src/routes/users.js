// URLS De autenticacion de usuario
const express = require('express');
const router =  express.Router();

const User = require('../models/User');
const Usuario = require('../models/Usuario');
const Pago =  require('../models/Pago');
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
    res.locals.user2=undefined;
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

router.get('/users/login_afiliado', function(req, res){
    res.render('users/login_afiliado.hbs');
});

router.post('/users/logeando_afiliado', async(req, res) => {
    
    const{ email, password } = req.body;
    const errors=[];
        const afiliados = await Usuario.find({correo: email, contraseña: password});
        const afiliados2=[];

    
        for(var a in afiliados){
            afiliados2.push({
                _id: afiliados[a]._id, correo:afiliados[a].correo, contraseña:afiliados[a].contraseña,
                nombres:afiliados[a].nombres, apellidos:afiliados[a].apellidos, dpi:afiliados[a].dpi,
                direccion:afiliados[a].direccion, telefono:afiliados[a].telefono, rol:afiliados[a].rol,
                vigente: afiliados[a].vigente, fecha_inicio: afiliados[a].fecha_inicio, fecha_fin: afiliados[a].fecha_fin
                });
        }

        if(Object.keys(afiliados2).length === 0){  
            errors.push({text:'El Usuario No Existe',});
            res.render('users/login_afiliado.hbs',{errors});
        }else{
            let consulta = {};
            consulta.codigo_afiliado=afiliados2._id;
            const pagos2 = await Pago.find(consulta);
            globalUser=afiliados2._id;
            res.locals.user2=afiliados2;
            res.render('users/homeAfiliado.hbs',{afiliados2});
        }
        
    
});



module.exports = router;