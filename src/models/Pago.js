  
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
            type: Date,
            default: Date.now
        }
        
    }
);

module.exports = model("Pago", PagoSchema);