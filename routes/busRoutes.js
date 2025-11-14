import express from "express";
// CRÍTICO: Eliminamos la importación de handleWebhook
import { createInvoice, getPayments } from "./../controllers/busController.js"; 
const router = express.Router();

router.post("/lnurlpay", createInvoice);
router.get("/payments", getPayments);

// CRÍTICO: Se eliminó la ruta router.post("/payment_notification", handleWebhook);

export default router;