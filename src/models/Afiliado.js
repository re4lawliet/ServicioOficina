  
const { Schema, model } = require("mongoose");

const AfiliadoSchema = new Schema(
    {
        codigo: {
            type: Number,
        },
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
            type: String,
            default: Date.now
        },
        fecha_fin: {
            type: String,
            default: Date.now
        },
        vigente: {
            type: Boolean,
            required: true
        }
        
    }
);

module.exports = model("Afiliado", AfiliadoSchema);