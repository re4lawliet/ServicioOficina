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
const fs = require('fs');
const path = require('path');
const KEY=fs.readFileSync(path.join(__dirname, '../keys/public.key'), 'utf-8');



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

            const afiliados_cod = await Usuario.find({rol: 'afiliado'}).sort({codigo:'desc'});
            var cod_final=1;
            if(afiliados_cod[0]){
                const cod=afiliados_cod[0].codigo;
                const x=parseInt(cod);
                cod_final=x+1;
            }
            console.log(cod_final);

            const new_filiado = new Usuario();
            new_filiado.codigo = cod_final;
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

    let consulta = {};
    consulta.codigo_afiliado=req.params.id;
    const pagos = await Pago.find(consulta).sort({fecha:'desc'});
    await Pago.findByIdAndDelete(pagos[0]._id);

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
        consulta.codigo=idd;
        consulta.contraseña=pass;
        const afiliado = await Usuario.find(consulta);
        
        const objretorno={};
        objretorno.codigo=afiliado[0].codigo;
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
//Parametros [jwt: codigo:]
router.get('/pago', async(req, res) => {

    const codigo=req.query.codigo;
    
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
        if(!codigo){
            res.send('codigo de afiliado no existe').status(404);
        }
        const user = await Usuario.find({codigo: codigo}).sort({fecha:'desc'});
        const idd=user[0]._id;

        let consulta = {};
        consulta.codigo_afiliado=idd;
        
        const pagos = await Pago.find(consulta).sort({fecha:'desc'});
        const pagos_retorno={};
        pagos_retorno.id=pagos[0]._id;
        pagos_retorno.monto=pagos[0].monto;
        pagos_retorno.fecha=pagos[0].fecha;
        res.send(pagos_retorno).status(200);
    }
});
//Parametros [jwt: codigo: monto:]
router.post('/pago', async(req, res) => {
    
    if(!req.body.jwt){
        res.send('El JWT no es válido o no contiene el scope de este servicio').status(403);
    }
    //Validacion del Toquen
    const validaToken=true;
    const token=req.body.jwt;
    jwt.verify(token, KEY, (err, data) => {
        if(err){
            console.log('El JWT no es válido');
            alidaToken=false;
            res.send('El JWT no es válido').status(403);
            
        }     
    });

    if(validaToken){

        if(!req.body.monto){
            res.send('Monto No Existe').status(404);
        }
        if(!req.body.codigo){
            res.send('Codigo No Existe en Body').status(404);
        }
        const idd=req.body.codigo;
        const monto=req.body.monto;
        const user=await Usuario.findOne({codigo: idd});

        if(!user){
            console.log("Error1");
            res.send('El codigo de Afiliado no Existe').status(406);  
        }else{
            if(monto!="100"){
                console.log("Error2");
                res.send('Monto debe ser de 100.00 Q').status(406); 
            }else{
                if(user.vigente){
                    console.log("Error3");
                    res.send('El Usuario Aun esta Vigente').status(406); 
                }else{
                    const new_pago = new Pago();
                    new_pago.codigo_afiliado =  user._id;
                    new_pago.monto = monto; 
                    new_pago.save();

                    const afiliados2=await Usuario.findById(user._id);
                    afiliados2.vigente='1';
                    await afiliados2.save();

                    let consulta = {};
                    consulta.codigo_afiliado=user._id;
                    const pagos = await Pago.find(consulta).sort({fecha:'desc'});
                    const pagos_retorno={};
                    pagos_retorno.id=pagos[0]._id;
                    pagos_retorno.monto=pagos[0].monto;
                    pagos_retorno.fecha=pagos[0].fecha;
                    res.send(pagos_retorno).status(200);
                    
                }
            }
        }

    }
    
});

router.post('/afiliado', async(req, res) => {
    
    if(!req.body.jwt){
        res.send('El JWT no es válido o no contiene el scope de este servicio').status(403);
    }
    //Validacion del Toquen
    const validaToken=true;
    const token=req.body.jwt;
    jwt.verify(token, KEY, (err, data) => {
        if(err){
            console.log('El JWT no es válido');
            alidaToken=false;
            res.send('El JWT no es válido').status(403);
            
        }     
    });

    if(validaToken){

       if(!req.body.nombre){
        res.send('El Nombre no Existe').status(403);
       }
       if(!req.body.password){
        res.send('El password no existe').status(403);
       }

       const nombre=req.body.nombre;
       const password=req.body.password;

       const afiliados_cod = await Usuario.find({rol: 'afiliado'}).sort({codigo:'desc'});
        var cod_final=1;
        if(afiliados_cod[0]){
            const cod=afiliados_cod[0].codigo;
            const x=parseInt(cod);
            cod_final=x+1;
        }
        console.log(cod_final);

        const new_filiado = new Usuario();
        new_filiado.codigo=cod_final;
        new_filiado.correo =  nombre+"@gmail.com";
        new_filiado.contraseña = password; 
        new_filiado.nombres = nombre;
        new_filiado.apellidos = nombre;
        new_filiado.dpi = 'null';
        new_filiado.direccion = 'null';
        new_filiado.telefono = 'null';
        new_filiado.rol = 'afiliado';
        new_filiado.usuario_creador = 'null'; 
        new_filiado.vigente = '0';
        await new_filiado.save();
        
        let consulta = {};
        consulta.correo=nombre+"@gmail.com";
        const user = await Usuario.find(consulta);
        const user_retorno={};
        user_retorno.codigo=user[0].codigo;
        user_retorno.nombre=user[0].nombres;
        user_retorno.vigente=user[0].vigente;
        res.send(user_retorno).status(200);

    }
    
});

router.put('/afiliado', async(req, res) => {

    if(!req.body.jwt){
        res.send('El JWT no es válido o no contiene el scope de este servicio').status(403);
    }
    //Validacion del Toquen
    const validaToken=true;
    const token=req.body.jwt;
    jwt.verify(token, KEY, (err, data) => {
        if(err){
            console.log('El JWT no es válido');
            alidaToken=false;
            res.send('El JWT no es válido').status(403);
            
        }     
    });
    if(validaToken){

        const user_cod = await Usuario.find({codigo: req.body.codigo}).sort({fecha:'desc'});
        const idd=user_cod[0]._id;
        const pass=req.body.password;
        if(!idd){
            res.send('codigo de afiliado no existe').status(404);
        }
        if(!pass){
            res.send('autenticacion no exitosa').status(401);
        }
    
        let consulta = {};
        consulta.codigo=req.body.codigo;

        var bandera1=0;
        var bandera2=0;

        let consultachange={};
        if(req.body.nombre){
            consultachange.nombres=req.body.nombre;
            bandera1=1;
        }
        if(req.body.password){
            consultachange.contraseña=req.body.password;
            bandera2=1;
        }

        if(bandera1==1&&bandera2==1){
            await Usuario.findByIdAndUpdate(idd, {nombres: req.body.nombre, contraseña: req.body.password});
        }else if(bandera1==0&&bandera2==1){
            await Usuario.findByIdAndUpdate(idd, {contraseña: req.body.password});
        }else if(bandera1==1&&bandera2==0){
            await Usuario.findByIdAndUpdate(idd, {nombres: req.body.nombre});
        }
        
        //console.log(consulta);
        const user = await Usuario.find(consulta);
        //console.log(user);
        const user_retorno={};
        user_retorno.codigo=user[0].codigo;
        user_retorno.nombre=user[0].nombres;
        user_retorno.vigente=user[0].vigente;
        res.send(user_retorno).status(200);
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

