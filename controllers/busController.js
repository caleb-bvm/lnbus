import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const LNBITS_URL = process.env.LNBITS_URL || "http://chirilicas.com:5000/api/v1/wallet";
const ADMIN_KEY = process.env.BUS_ADMIN_KEY || "f55682d14a044ba88060411fadd61023";

export const createInvoice = async (req, res) => {
  try {
    const { amount, memo } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: "Monto inválido" });
    }
    const resp = await axios.post(
      `${LNBITS_URL}/api/v1/payments`,
      { out: false, amount: Number(amount), memo: memo || "Pasaje Bus" },
      { headers: { "X-Api-Key": ADMIN_KEY, "Content-Type": "application/json" } }
    );
    return res.json({ success: true, invoice: resp.data.payment_request, raw: resp.data });
  } catch (err) {
    console.error("createInvoice error:", err.response?.data || err.message);
    return res.status(500).json({ success: false, error: "Error creando factura", detail: err.response?.data || err.message });
  }
};

export const getPayments = async (req, res) => {
  try {
    const resp = await axios.get(`${LNBITS_URL}/api/v1/payments`, {
      headers: { "X-Api-Key": ADMIN_KEY }
    });
    return res.json({ success: true, payments: resp.data });
  } catch (err) {
    console.error("getPayments error:", err.response?.data || err.message);
    return res.status(500).json({ success: false, error: "Error obteniendo pagos", detail: err.response?.data || err.message });
  }
};
