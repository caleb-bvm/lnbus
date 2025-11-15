import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const LNBITS_BASE_URL = process.env.LNBITS_BASE_URL;
const ADMIN_KEY = process.env.BUS_ADMIN_KEY; 
const WALLET_ID = process.env.WALLET_ID;
const WEBHOOK_URL = process.env.BUS_WEBHOOK_URL; 
const PASSENGER_INVOICE_KEY = process.env.PASSENGER_INVOICE_KEY; 
const PASSENGER_ADMIN_KEY = process.env.PASSENGER_ADMIN_KEY;


const getBitcoinPrice = async () => {
  try {
    const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
    return response.data.bitcoin.usd;
  } catch (err) {
    console.warn("ADVERTENCIA: No se pudo obtener el precio de BTC. Usando $60,000 USD como respaldo.");
    return 60000;
  }
};

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

const getPayments = async (req, res) => {
  try {
    const resp = await axios.get(`${LNBITS_BASE_URL}/satspay/api/v1/charges/`, {
      headers: { "X-Api-Key": ADMIN_KEY }
    });

    const charges = resp.data;

    const simplifiedPayments = charges.map(c => {
      let unixTime = 0;
      if (c.timestamp) {
        unixTime = Math.floor(Date.parse(c.timestamp) / 1000); 
      }

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
    return res.status(500).json({ success: false, error: "Error obteniendo pagos de SatsPayServer", detail: err.response?.data || err.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const { usd_amount, description } = req.body;
    
    if (!usd_amount || isNaN(Number(usd_amount)) || Number(usd_amount) <= 0) {
      return res.status(400).json({ success: false, error: "Monto en USD inválido" });
    }

    const btcPrice = await getBitcoinPrice();
    const usdValue = Number(usd_amount);
    const satoshis = Math.round((usdValue / btcPrice) * 100000000);
    
    if (satoshis < 1) {
      return res.status(400).json({ success: false, error: "Monto muy bajo para ser cobrado en satoshis." });
    }

    const memo = description || `Pasaje Bus - $${usdValue} USD (SatsPayServer)`;

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

const decodeInvoice = async (req, res) => {
  const { bolt11_invoice } = req.body;

  if (!bolt11_invoice) {
    return res.status(400).json({ detail: 'Falta la factura BOLT11.' });
  }

  try {
    const apiUrl = `${LNBITS_BASE_URL}/api/v1/payments/decode`; 
    const headers = { 'X-Api-Key': PASSENGER_INVOICE_KEY };
    
    const response = await axios.post(apiUrl, {
      data: bolt11_invoice 
    }, { headers });
    
    const decoded = response.data;
    
    if (decoded && decoded.amount_msat !== undefined) {
      const amount_sats = Math.floor(decoded.amount_msat / 1000); 
      
      return res.status(200).json({ 
        success: true, 
        amount_sats: amount_sats,
        detail: 'Factura decodificada con éxito.'
      });
    }
    
    return res.status(400).json({ detail: 'Factura no decodificada o formato de respuesta inválido.' });

  } catch (error) {
    console.error("Error al decodificar la factura:", error.response?.data || error.message);
    const errorDetail = error.response?.data?.detail || 'Fallo al decodificar la factura. Verifica que sea válida.';
    return res.status(500).json({ 
      detail: errorDetail
    });
  }
};

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

const payInvoice = async (req, res) => {
  try {
    const { bolt11_invoice } = req.body;
    
    if (!bolt11_invoice) {
      return res.status(400).json({ success: false, error: "El contenido del QR (BOLT11) es requerido." });
    }

    const decodeResp = await axios.post(
      `${LNBITS_BASE_URL}/api/v1/payments/decode`,
      { data: bolt11_invoice },
      { headers: { "X-Api-Key": PASSENGER_INVOICE_KEY } }
    );
    const amountSats = decodeResp.data.amount_msat / 1000;
    
    const paymentResp = await axios.post(
      `${LNBITS_BASE_URL}/api/v1/payments`,
      { out: true, bolt11: bolt11_invoice },
      { headers: { "X-Api-Key": PASSENGER_ADMIN_KEY } }
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

const simulateTopUp = async (req, res) => {
  const TOP_UP_AMOUNT_SATS = 16666; 
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, error: "Token de recarga requerido." });
  }

  try {
    const resp = await axios.post(
      `${LNBITS_BASE_URL}/api/v1/payments`,
      {
        out: false,
        amount: TOP_UP_AMOUNT_SATS,
        memo: `Recarga Punto Express - Token: ${token.substring(0, 8)}`
      },
      { headers: { "X-Api-Key": PASSENGER_ADMIN_KEY, "Content-Type": "application/json" } }
    );
    
    return res.json({ 
      success: true, 
      message: `¡Recarga de ${TOP_UP_AMOUNT_SATS} sats exitosa!`,
      new_balance_query: "El frontend consultará el nuevo saldo."
    });

  } catch (err) {
    console.error("simulateTopUp error:", err.response?.data || err.message);
    return res.status(500).json({ success: false, error: "Error simulando la recarga Lightning.", detail: err.response?.data?.detail || "Fallo de LNbits." });
  }
};
  
export { getPayments, createInvoice, getPassengerBalance, payInvoice, simulateTopUp, decodeInvoice };
