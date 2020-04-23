  
const { Schema, model } = require("mongoose");

const PagoSchema = new Schema(
    {
        codigo_afiliado: {
            type: String,
            required: true
        },
        monto: {
            type: Number,
            required: true
        },
        fecha: {
            type: String,
            default: Date.now
        }
        
    }
);

module.exports = model("Pago", PagoSchema);