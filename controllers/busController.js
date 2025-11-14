import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// --- CONFIGURACIÓN DE ENTORNOS Y CLAVES ---
const LNBITS_BASE_URL = process.env.LNBITS_BASE_URL;
const ADMIN_KEY = process.env.BUS_ADMIN_KEY; 
const WALLET_ID = process.env.WALLET_ID;
const WEBHOOK_URL = process.env.BUS_WEBHOOK_URL; 
const PASSENGER_INVOICE_KEY = process.env.PASSENGER_INVOICE_KEY; 

// --- UTILIDADES ---

/**
 * Obtiene el precio de Bitcoin en USD.
 */
const getBitcoinPrice = async () => {
  try {
    const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
    return response.data.bitcoin.usd;
  } catch (err) {
    console.warn("ADVERTENCIA: No se pudo obtener el precio de BTC. Usando $60,000 USD como respaldo.");
    return 60000;
  }
};

/**
 * Obtiene los detalles completos de un Cargo de SatsPayServer.
 */
const getChargeDetails = async (chargeId) => {
  try {
    const resp = await axios.get(`${LNBITS_BASE_URL}/satspay/api/v1/charge/${chargeId}`, {
      headers: { "X-Api-Key": ADMIN_KEY }
    });
    return resp.data;
  } catch (err) {
    console.error(`Error al obtener detalles del cargo ${chargeId}:`, err.response?.data || err.message);
    return null;
  }
};

// --- CONTROLADORES DE LA APP DEL CHOFER (POS) ---

/**
 * Módulo 1: Obtener el historial de PAGOS (Polling al historial de Cargos de SatsPayServer).
 */
const getPayments = async (req, res) => {
  try {
    const resp = await axios.get(`${LNBITS_BASE_URL}/satspay/api/v1/charges/`, {
      headers: { "X-Api-Key": ADMIN_KEY }
    });

    const charges = resp.data;

    const simplifiedPayments = charges.map(c => {
      let unixTime = 0;
      // Convierte la cadena ISO 8601 (c.timestamp) a UNIX timestamp
      if (c.timestamp) {
          unixTime = Math.floor(Date.parse(c.timestamp) / 1000); 
      }

      // Usa el booleano 'paid' para determinar el estado final
      let statusString;
      if (c.paid === true) {
          statusString = 'paid';
      } else if (c.status === 'expired') {
          statusString = 'expired';
      } else {
          statusString = 'pending';
      }

      return {
          checking_id: c.id,
          amount: c.amount,
          time: unixTime, 
          status: statusString, 
          memo: c.description,
      };
    }).reverse(); 

    return res.json({ success: true, payments: simplifiedPayments });
  } catch (err) {
    console.error("getPayments error:", err.response?.data || err.message);
    return res.status(500).json({ success: false, error: "Error obteniendo pagos", detail: err.response?.data || err.message });
  }
};

/**
 * Módulo 2: Crear Cargo (Invoice) con SatsPayServer.
 */
const createInvoice = async (req, res) => {
  try {
    const { usd_amount, description } = req.body;
    
    if (!usd_amount || isNaN(usd_amount) || Number(usd_amount) <= 0) {
      return res.status(400).json({ success: false, error: "Monto en USD inválido" });
    }

    const btcPrice = await getBitcoinPrice();
    const usdValue = Number(usd_amount);
    const satoshis = Math.round((usdValue / btcPrice) * 100000000);
    
    if (satoshis < 1) {
        return res.status(400).json({ success: false, error: "Monto muy bajo para ser cobrado en satoshis." });
    }

    const memo = description || `Pasaje Bus - $${usdValue} USD`;

    const resp = await axios.post(
      `${LNBITS_BASE_URL}/satspay/api/v1/charge`, 
      {
        lnbitswallet: WALLET_ID,
        description: memo,
        amount: satoshis,        
        webhook_url: WEBHOOK_URL, 
        time: 60,
      },
      { headers: { "X-Api-Key": ADMIN_KEY, "Content-Type": "application/json" } }
    );

    const chargeId = resp.data.id;
    const chargeDetails = await getChargeDetails(chargeId);
    
    if (!chargeDetails) {
        return res.status(500).json({ success: false, error: "Cargo creado pero detalles inaccesibles para QR." });
    }
    
    const qrContent = chargeDetails.payment_request; 
    
    return res.json({ 
        success: true, 
        charge_id: chargeId, 
        qr_content: qrContent, 
        satoshis_amount: satoshis,
        usd_amount: usdValue
    });

  } catch (err) {
    console.error("createBusCharge error:", err.response?.data || err.message);
    return res.status(500).json({ success: false, error: "Error creando cargo de SatsPayServer", detail: err.response?.data || err.message });
  }
};


// --- CONTROLADORES DE LA BUS WALLET (PASAJERO) ---

/**
 * Módulo 3: Obtener el Saldo REAL de la Bus Wallet.
 */
const getPassengerBalance = async (req, res) => {
    try {
        const resp = await axios.get(`${LNBITS_BASE_URL}/api/v1/wallet`, {
            headers: { "X-Api-Key": PASSENGER_INVOICE_KEY }
        });
        const balanceSats = Math.floor(resp.data.balance / 1000); 
        return res.json({ success: true, balance: balanceSats, unit: 'sats' });
    } catch (err) {
        console.error("getPassengerBalance error:", err.response?.data || err.message);
        return res.status(500).json({ success: false, error: "Error obteniendo saldo de la Bus Wallet." });
    }
};

/**
 * Módulo 4: Pagar Factura desde la Bus Wallet (Flujo REAL)
 */
const payInvoice = async (req, res) => {
  try {
    const { bolt11_invoice } = req.body;
    
    if (!bolt11_invoice) {
      return res.status(400).json({ success: false, error: "El contenido del QR (BOLT11) es requerido." });
    }

    // 1. Decodificar la factura para obtener el monto
    const decodeResp = await axios.post(
        `${LNBITS_BASE_URL}/api/v1/payments/decode`,
        { data: bolt11_invoice },
        { headers: { "X-Api-Key": PASSENGER_INVOICE_KEY } }
    );
    const amountSats = decodeResp.data.amount_msat / 1000;
    
    // 2. Realizar el Pago (desde la Bus Wallet)
    const paymentResp = await axios.post(
      `${LNBITS_BASE_URL}/api/v1/payments`,
      { out: true, bolt11: bolt11_invoice }, // out: true significa PAGO SALIENTE
      { headers: { "X-Api-Key": PASSENGER_INVOICE_KEY } } // Clave real del Pasajero
    );

    return res.json({ 
        success: true, 
        message: "¡Pasaje pagado con éxito!",
        payment_hash: paymentResp.data.payment_hash,
        amount_sats: amountSats,
    });

  } catch (err) {
    console.error("payInvoice error:", err.response?.data || err.message);
    const errorDetail = err.response?.data?.detail || "Error desconocido al procesar el pago.";
    return res.status(500).json({ success: false, error: "Error en el pago Lightning", detail: errorDetail });
  }
};


export { getPayments, createInvoice, getPassengerBalance, payInvoice };