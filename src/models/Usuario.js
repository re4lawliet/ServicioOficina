  
const { Schema, model } = require("mongoose");

const UsuarioSchema = new Schema(
    {
        correo: {
            type: String,
            required: true
        },
        contraseña: {
            type: String,
            required: true
        },
        nombres: {
            type: String
        },
        apellidos: {
            type: String
        },
        dpi: {
            type: String
        },
        direccion: {
            type: String
        },
        telefono: {
            type: String
        },
        rol: {
            type: String,
            required: true
        },
        usuario_creador: {
            type: String,
        },
        fecha_inicio: {
            type: Date,
            default: Date.now
        },
        fecha_fin: {
            type: Date,
            default: Date.now
        },
        vigente: {
            type: Boolean,
            required: true
        }
        
    }
);

module.exports = model("Usuario", UsuarioSchema);