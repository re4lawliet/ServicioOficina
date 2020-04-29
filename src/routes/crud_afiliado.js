const express = require('express');
const router =  express.Router();
const fetch = require('node-fetch');
const fetchQuery = require('../request-manager');
const multer = require('multer');
const upload = require('../config/storage');

const Usuario = require('../models/Usuario');
const Pago =  require('../models/Pago');
const URL_SERVER='http://localhost:3001/';
const jwt = require('jsonwebtoken');
const data = require('../keys.json');
const KEY="201314646";



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
    const afiliados = await Usuario.find({_id: id_afiliado});
    const afiliados2=[];
    for(var a in afiliados){
        afiliados2.push({
            _id: afiliados[a]._id, correo:afiliados[a].correo, contraseña:afiliados[a].contraseña,
            nombres:afiliados[a].nombres, apellidos:afiliados[a].apellidos, dpi:afiliados[a].dpi,
            direccion:afiliados[a].direccion, telefono:afiliados[a].telefono, rol:afiliados[a].rol,
            vigente: afiliados[a].vigente, fecha_inicio: afiliados[a].fecha_inicio, fecha_fin: afiliados[a].fecha_fin
            });
    }

    const pagos = await Pago.find({codigo_afiliado: id_afiliado});
    const pagos2=[];
    for(var a in pagos){
        pagos2.push({
            _id: pagos[a]._id, codigo_afiliado:pagos[a].codigo_afiliado, monto:pagos[a].monto,
            fecha:pagos[a].fecha
            });
    }


    res.render("afiliado/pago_afiliado.hbs", { afiliado2: afiliados2, pago2:pagos2 });

    /*
    const id_afiliado=req.params.id;
    const URL=URL_SERVER+"afiliado/"+id_afiliado;
    const URL_PAGOS=URL_SERVER+"pago?codigo="+id_afiliado;
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
            .json({ estado: 500, mensaje: "Fallo en SErvicio Pago GET" });
        })
    )
    .catch(function (err) {
      return res
        .status(500)
        .json({ estado: 500, mensaje: "FAllo en Get Afiliado" });
    });*/

});

router.post('/admin/pagar_afiliado/:id', async(req, res) => {
    const {monto} = req.body;
    const idd=req.params.id;


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
    const user=await Usuario.findOne({_id: idd});
    if(!user){
        req.flash('succes_msg', 'codigo de afiliado no existe');
        res.redirect('/admin/lista_afiliados');
    }else{
        if(!monto){
            req.flash('succes_msg', 'Monto Invalido');
            res.redirect('/admin/lista_afiliados');
        }else{
            if(monto!="100"){
                req.flash('succes_msg', 'Monto debe ser de 100Q');
                res.redirect('/admin/lista_afiliados');
            }else{
                if(user.vigente){
                    res.send('el usuario aun tiene membresia');           
                }else{
                    const new_pago = new Pago();
                    new_pago.codigo_afiliado =  idd;
                    new_pago.monto = monto; 
                    new_pago.save();

                    const afiliados2=await Usuario.findById(idd);
                    afiliados2.vigente='1';
                    await afiliados2.save();

                    req.flash('succes_msg', 'Pago Exitoso');
                    res.redirect('/admin/lista_afiliados');
                }
            }
        }
    }

    /*
    const {monto} = req.body;
    const idd=req.params.id;
    const URL=URL_SERVER+"pago?codigo="+idd+"&monto="+ monto;
    
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
        .json({ estado: 500, mensaje: "Fallo En llamada a Pago POST" });
    });*/
});


//************       Metodos de Servicio   *************************/

//Parametros [jwt:, codigo:, password:]
router.get('/afiliado', async(req, res) => {
    
    const idd=req.query.codigo;
    const pass=req.query.password;

    if(!req.query.jwt){
        res.send('El JWT no es válido o no contiene el scope de este servicio').status(403);
    }

    //Validacion del Toquen
    const validaToken=true;
    const token=req.query.jwt;
    jwt.verify(token, KEY, (err, data) => {
        if(err){
            console.log('El JWT no es válido');
            alidaToken=false;
            res.send('El JWT no es válido').status(403);
            
        }     
    });
    
    if(validaToken){
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
        
        const objretorno={};
        objretorno.codigo=afiliado[0]._id;
        objretorno.nombre=afiliado[0].nombres + " " +afiliado[0].apellidos;
        objretorno.vigente=afiliado[0].vigente;
        objretorno.rol=afiliado[0].rol;
        console.log(objretorno);
        if(Object.keys(afiliado).length === 0){ 
            res.send('Fallo En Autenticacion');
        }else{
            res.send(objretorno).status(200);
        }
    }

});
//Parametros [codigo:]
router.get('/pago', async(req, res) => {

    const idd=req.query.codigo;
    
    if(!req.query.jwt){
        res.send('El JWT no es válido o no contiene el scope de este servicio').status(403);
    }  

    //Validacion del Toquen
    const validaToken=true;
    const token=req.query.jwt;
    jwt.verify(token, KEY, (err, data) => {
        if(err){
            console.log('El JWT no es válido');
            alidaToken=false;
            res.send('El JWT no es válido').status(403);
            
        }     
    });

    if(validaToken){
        if(!idd){
            res.send('codigo de afiliado no existe').status(404);
        }
        let consulta = {};
        consulta.codigo_afiliado=idd;
        
        const pagos = await Pago.find(consulta).sort({date:'desc'});
        const pagos_retorno={};
        pagos_retorno.id=pagos[0]._id;
        pagos_retorno.monto=pagos[0].monto;
        pagos_retorno.fecha=pagos[0].fecha;
        res.send(pagos_retorno).status(200);
    }
});
//Parametros [codigo: monto:]
router.post('/pago', async(req, res) => {
    if(!req.query.jwt){
        res.send('El JWT no es válido o no contiene el scope de este servicio').status(403);
    }
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

    const idd=req.query.codigo;
    const monto=req.query.monto;
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

//************      OTROS   *************************/
//Parametros [codigo]
router.get('/afiliado/:codigo', async(req, res) => {
    
    const idd=req.params.codigo;

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
router.get('/jwt', async(req, res) => {

    /*var URL_TOKEN='http://3.94.79.29:8000';

    var credenciales = {
        client_id: 'giovannilopez', 
        client_secret: 'miacceso123'
    }
    var token = await fetchQuery(URL_TOKEN+'/getToken/','POST', credenciales).then()
    .catch(function(err){
        console.log(err.status, err.statusText)
    });
    console.log(token);*/

    
    const token = await fetch("http://35.193.70.253/GetToken?client_id=123456789123456789&password=subastas123**", {
        method: "get",
        headers: { "Content-Type": "application/json" },
        timeout: 3000,
    })
    .then((res) => res.json())
    .catch(function (err) {
      return res
        .status(500)
        .json({ estado: 500, mensaje: "Tiempo de respuesta exedido." });
    });

    if(!token){
        return res.status(401).json({
            auth: false,
            mensaje: 'No hay Token'
        });
    }


    //return jwt.verify(token, ['public_key'], { algorithms: ["RS256"] });
    jwt.verify(token.token, data.auctions.public_key, (err, data) => {
        if(err){
            console.log('entro a rerror');
            res.sendStatus(403);
        }else{
            res.json({
                text: 'hola acepte token',
                text2: ':D :D :D',
                data: data
            });
        }      
    });

    /*console.log(token.token);
    const decodificada = jwt.verify(token.token, data.auctions.public_key, { algorithms: ["RS256"] });
    console.log(decodificada);
    res.send('Si Jala');*/
   
});


module.exports = router;

