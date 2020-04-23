const express = require('express');
const router =  express.Router();
const fetch = require('node-fetch');
const fetchQuery = require('../request-manager');
const multer = require('multer');
const upload = require('../config/storage');

const Usuario = require('../models/Usuario');


//************       Metodos de Funcionalidad   *************************/

router.get('/admin/new_afiliado', (req, res) => {
    res.render('afiliado/crear_afiliado.hbs');
});

router.post('/admin/crear_afiliado', async(req, res) => {
    
    const{ email,password,confirm_password,nombres,apellidos,dpi,telefono,direccion } = req.body;
    const errors=[];

    if(password != confirm_password){
        errors.push({text:'Contraseña no coincide'});
    }
    if(password.length < 4){
        errors.push({text:'La contraseña debe ser mayor que 4 caracteres',});
    }
    
    if(errors.length>0){
        res.render('afiliado/crear_afiliado.hbs', {
            errors
        });
    }else{


        const emailuser=await Usuario.findOne({email: email});
        
        if(emailuser){
            errors.push({text:'El Usuario Afiliado Ya esta en Uso',});
            res.render('afiliado/crear_afiliado.hbs', {errors});
        }else{
            const new_filiado = new Usuario();
            new_filiado.correo =  email;
            new_filiado.contraseña = password; 
            new_filiado.nombres = nombres;
            new_filiado.apellidos = apellidos;
            new_filiado.dpi = dpi;
            new_filiado.direccion = direccion;
            new_filiado.telefono = telefono;
            new_filiado.rol = 'afiliado';
            new_filiado.usuario_creador = req.user.id; 
            new_filiado.vigente = '0';

            await new_filiado.save();
            req.flash('succes_msg', 'Afiliado Creado Con exito');
            res.redirect('/admin/lista_afiliados');
        }
    }

});

router.get('/admin/lista_afiliados', async (req, res) => {

    const afiliados = await Usuario.find({rol: 'afiliado'}).sort({date:'desc'})
    const afiliados2=[];

    
    for(var a in afiliados){
        afiliados2.push({
            _id: afiliados[a]._id, correo:afiliados[a].correo, contraseña:afiliados[a].contraseña,
            nombres:afiliados[a].nombres, apellidos:afiliados[a].apellidos, dpi:afiliados[a].dpi,
            direccion:afiliados[a].direccion, telefono:afiliados[a].telefono, rol:afiliados[a].rol,
            vigente: afiliados[a].vigente, fecha_inicio: afiliados[a].fecha_inicio, fecha_fin: afiliados[a].fecha_fin
            });
    }

    
    res.render('afiliado/lista_afiliados.hbs', { 
        afiliados2 
    });
});

router.delete('/admin/delete_afiliado/:id', async(req, res) => {
    await Usuario.findByIdAndDelete(req.params.id);
    req.flash('succes_msg','Se A eliminado Afiliado');
    res.redirect('/admin/lista_afiliados');
});

router.get('/admin/cancelar_afiliado/:id', async(req, res) => {
    
    const afiliados=await Usuario.findById(req.params.id);
    afiliados.vigente='0';
    await afiliados.save();

    req.flash('succes_msg','Suscripcion Cancelada');
    res.redirect('/admin/lista_afiliados');
});

router.get('/admin/pagar_afiliado/:id', async(req, res) => {
    
    const afiliados=await Usuario.findById(req.params.id);
    afiliados.vigente='1';
    await afiliados.save();

    req.flash('succes_msg','Suscripcion Pagada');
    res.redirect('/admin/lista_afiliados');
});




module.exports = router;