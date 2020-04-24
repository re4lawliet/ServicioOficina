const express = require('express');
const router =  express.Router();
const fetch = require('node-fetch');
const fetchQuery = require('../request-manager');
const multer = require('multer');
const upload = require('../config/storage');

const Usuario = require('../models/Usuario');


//************       Metodos de Funcionalidad   *************************/

router.get('/admin/new_ajustador', (req, res) => {
    res.render('ajustador/crear_ajustador.hbs');
});

router.post('/admin/crear_ajustador', async(req, res) => {
    
    const{ email,password,confirm_password,nombres,apellidos,dpi,telefono,direccion } = req.body;
    const errors=[];

    if(password != confirm_password){
        errors.push({text:'Contraseña no coincide'});
    }
    if(password.length < 4){
        errors.push({text:'La contraseña debe ser mayor que 4 caracteres',});
    }
    
    if(errors.length>0){
        res.render('ajustador/crear_ajustador.hbs', {
            errors
        });
    }else{


        const emailuser=await Usuario.findOne({email: email});
        
        if(emailuser){
            errors.push({text:'El Usuario Ajustador Ya esta en Uso',});
            res.render('ajustador/crear_ajustador.hbs', {errors});
        }else{
            const new_ajustador = new Usuario();
            new_ajustador.correo =  email;
            new_ajustador.contraseña = password; 
            new_ajustador.nombres = nombres;
            new_ajustador.apellidos = apellidos;
            new_ajustador.dpi = dpi;
            new_ajustador.direccion = direccion;
            new_ajustador.telefono = telefono;
            new_ajustador.rol = 'ajustador';
            new_ajustador.usuario_creador = req.user.id; 
            new_ajustador.vigente = '1';

            await new_ajustador.save();
            req.flash('succes_msg', 'Ajustador Creado Con exito');
            res.redirect('/admin/lista_ajustadores');
        }
    }

});

router.get('/admin/lista_ajustadores', async (req, res) => {

    const ajustadores = await Usuario.find({rol: 'ajustador'}).sort({date:'desc'})
    const ajustadores2=[];

    
    for(var a in ajustadores){
        ajustadores2.push({
            _id: ajustadores[a]._id, correo:ajustadores[a].correo, contraseña:ajustadores[a].contraseña,
            nombres:ajustadores[a].nombres, apellidos:ajustadores[a].apellidos, dpi:ajustadores[a].dpi,
            direccion:ajustadores[a].direccion, telefono:ajustadores[a].telefono, rol:ajustadores[a].rol
            });
    }
    res.render('ajustador/lista_ajustadores.hbs', { 
        ajustadores2 
    });
});

router.delete('/admin/delete_ajustador/:id', async(req, res) => {
    await Usuario.findByIdAndDelete(req.params.id);
    req.flash('succes_msg','Se A eliminado Ajustador');
    res.redirect('/admin/lista_ajustadores');
});

//************       Metodos de Servicio   *************************/


module.exports = router;