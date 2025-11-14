import express from "express";
import { createInvoice, getPayments, payInvoice, getPassengerBalance } from "./../controllers/busController.js";
const router = express.Router();

// Rutas de la APP DEL CONDUCTOR (POS)
router.post("/lnurlpay", createInvoice); // Crear Cargo (Invoice)
router.get("/payments", getPayments);    // Obtener Historial de Cargos (Polling)

// Rutas de la BUS WALLET (PASAJERO)
router.get("/passenger/balance", getPassengerBalance); // Obtener saldo real
router.post("/passenger/pay", payInvoice);           // Pagar factura del conductor

export default router;