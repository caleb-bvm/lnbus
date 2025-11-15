import express from "express";
import { 
    createInvoice, 
    getPayments, 
    payInvoice, 
    getPassengerBalance, 
    simulateTopUp, 
    decodeInvoice 
} from "./../controllers/busController.js";

const router = express.Router();

router.get("/passenger/balance", getPassengerBalance);
router.post("/passenger/pay", payInvoice);
router.post("/passenger/topup", simulateTopUp);

router.post("/passenger/decode-invoice", decodeInvoice); 

router.post("/lnurlpay", createInvoice); 
router.get("/payments", getPayments);

export default router;