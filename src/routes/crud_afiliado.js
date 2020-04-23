const express = require('express');
const router =  express.Router();
const fetch = require('node-fetch');
const fetchQuery = require('../request-manager');
const multer = require('multer');
const upload = require('../config/storage');

const Usuario = require('../models/Usuario');
const Pago =  require('../models/Pago');
const URL_SERVER='http://localhost:3001/';


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

router.get('/admin/ver_afiliado/:id', async(req, res) => {
    
    const id_afiliado=req.params.id;
    const URL=URL_SERVER+"afiliado/"+id_afiliado;
    const URL_PAGOS=URL_SERVER+"pago/"+id_afiliado;
    fetch(URL, {
        method: "get",
        headers: { "Content-Type": "application/json" },
        timeout: 3000,
    })
    .then((res) => res.json())
    .then((json) =>

        fetch(URL_PAGOS, {
            method: "get",
            headers: { "Content-Type": "application/json" },
            timeout: 3000,
        })
        .then((res) => res.json())
        .then((json2) =>
            res.render("afiliado/pago_afiliado.hbs", { afiliado2: json, pago2:json2 })
        )
        .catch(function (err) {
          return res
            .status(500)
            .json({ estado: 500, mensaje: "Tiempo de respuesta exedido." });
        })
    )
    .catch(function (err) {
      return res
        .status(500)
        .json({ estado: 500, mensaje: "Tiempo de respuesta exedido." });
    });

});

router.post('/admin/pagar_afiliado/:id', async(req, res) => {
    const {monto} = req.body;
    const idd=req.params.id;
    const URL=URL_SERVER+"pago/"+idd+"/"+ monto;
    
    fetch(URL, {
        method: "post",
        headers: { "Content-Type": "application/json" },
        timeout: 3000,
    })
    .then((res) => res.json())
    .then((json) =>
        res.render('afiliado/mensaje_pago.hbs', { 
            mensaje: json
        })
    )
    .catch(function (err) {
      return res
        .status(500)
        .json({ estado: 500, mensaje: "Tiempo de respuesta exedido." });
    });
});


//************       Metodos de Servicio   *************************/

router.get('/afiliado/:codigo/:password', async(req, res) => {
    
    const idd=req.params.codigo;
    const pass=req.params.password;

    if(!idd){
        res.send('codigo de afiliado no existe').status(404);
    }
    if(!pass){
        res.send('autenticacion no exitosa').status(401);
    }

    let consulta = {};
    consulta._id=idd;
    consulta.contraseña=pass;
    const afiliado = await Usuario.find(consulta);

    if(Object.keys(afiliado).length === 0){ 
        res.send('Fallo En Autenticacion');
    }else{
        res.send(afiliado).status(200);
    }

});

router.get('/afiliado/:codigo/:password?', async(req, res) => {
    
    const idd=req.params.codigo;
    const pass=req.params.password;

    if(!idd){
        res.send('codigo de afiliado no existe').status(404);
    }

    let consulta = {};
    consulta._id=idd;

    const afiliado = await Usuario.find(consulta);

    if(Object.keys(afiliado).length === 0){ 
        res.send('Fallo En Autenticacion');
    }else{
        res.send(afiliado).status(200);
    }

});

router.get('/pago/:codigo', async(req, res) => {

    const idd=req.params.codigo;
        
    if(!idd){
        res.send('codigo de afiliado no existe').status(404);
    }
    let consulta = {};
    consulta.codigo_afiliado=idd;
    
    const pagos = await Pago.find(consulta);
    res.send(pagos).status(200);
   
});

router.post('/pago/:codigo/:monto', async(req, res) => {

    const afiliados = await Usuario.find({rol: 'afiliado'}).sort({date:'desc'})
    const afiliados2 = [];
    for(var a in afiliados){
        afiliados2.push({
            _id: afiliados[a]._id, correo:afiliados[a].correo, contraseña:afiliados[a].contraseña,
            nombres:afiliados[a].nombres, apellidos:afiliados[a].apellidos, dpi:afiliados[a].dpi,
            direccion:afiliados[a].direccion, telefono:afiliados[a].telefono, rol:afiliados[a].rol,
            vigente: afiliados[a].vigente, fecha_inicio: afiliados[a].fecha_inicio, fecha_fin: afiliados[a].fecha_fin
            });
    }

    const mensaje={};

    const idd=req.params.codigo;
    const monto=req.params.monto;
    const user=await Usuario.findOne({_id: idd});
    if(!user){
        afiliados[0].nombres='codigo de afiliado no existe';
        res.send(afiliados).status(406);  
    }else{
        if(!monto){
            afiliados[0].nombres='Monto invalido no existe';
            res.send(afiliados).status(406);
        }else{
            if(monto!="100"){
                afiliados[0].nombres='Monto debe ser de 100Q';
                res.send(afiliados).status(406);
            }else{
                if(user.vigente){
                    afiliados[0].nombres='el usuario aun tiene membresia';
                    res.send(afiliados).status(406);
                }else{
                    const new_pago = new Pago();
                    new_pago.codigo_afiliado =  idd;
                    new_pago.monto = monto; 
                    new_pago.save();

                    const afiliados2=await Usuario.findById(idd);
                    afiliados2.vigente='1';
                    await afiliados2.save();

                    afiliados[0].nombres='PAgo Exitoso';
                    res.send(afiliados).status(406);
                }
            }
        }
    }
    
});


module.exports = router;

