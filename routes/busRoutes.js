import express from "express";
import { createInvoice, getPayments } from "./../controllers/busController.js";
const router = express.Router();

router.post("/invoice", createInvoice);
router.get("/payments", getPayments);

export default router;
