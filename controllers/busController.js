import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// --- CONFIGURACIÓN DE ENTORNOS Y CLAVES ---
const LNBITS_BASE_URL = process.env.LNBITS_BASE_URL || "http://chirilicas.com:5000";
const ADMIN_KEY = process.env.BUS_ADMIN_KEY || "f55682d14a044ba88060411fadd61023";
const WALLET_ID = process.env.WALLET_ID || "b1cfa446ed1448339eba3e3518173775";
const WEBHOOK_URL = process.env.BUS_WEBHOOK_URL || "http://tuserver.com/api/payment_notification"; 

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
 * Módulo 1: Obtener el historial de PAGOS (Polling al historial de Cargos).
 * CRÍTICO: Usa la API de SatsPayServer para obtener estado y timestamp fiables.
 */
export const getPayments = async (req, res) => {
  try {
    // Usamos la API de SatsPayServer para obtener todos los cargos
    const resp = await axios.get(`${LNBITS_BASE_URL}/satspay/api/v1/charges/`, {
      headers: { "X-Api-Key": ADMIN_KEY }
    });

    const charges = resp.data;

    const simplifiedPayments = charges.map(c => {
      let unixTime = 0;
      // CRÍTICO: Usamos el campo 'timestamp' (ISO 8601) para la fecha
      if (c.timestamp) {
          // Date.parse convierte la cadena ISO a milisegundos. Dividimos por 1000.
          unixTime = Math.floor(Date.parse(c.timestamp) / 1000); 
      }

      // CRÍTICO: Usamos el booleano 'paid' para determinar el estado final
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
          time: unixTime, // UnixTime válido o 0
          status: statusString, // Estado de cadena fiable
          memo: c.description,
      };
    }).reverse(); // Los más recientes al inicio

    return res.json({ success: true, payments: simplifiedPayments });
  } catch (err) {
    console.error("getPayments error:", err.response?.data || err.message);
    return res.status(500).json({ success: false, error: "Error obteniendo pagos", detail: err.response?.data || err.message });
  }
};

/**
 * Módulo 2: Crear/Actualizar Cargo de SatsPayServer (Tarifa y QR para Frontend).
 */
export const createInvoice = async (req, res) => {
  try {
    const { usd_amount, description } = req.body;
    
    if (!usd_amount || isNaN(usd_amount) || Number(usd_amount) <= 0) {
      return res.status(400).json({ success: false, error: "Monto en USD inválido" });
    }

    // 1. Obtener precio de BTC y calcular Satoshis
    const btcPrice = await getBitcoinPrice();
    const usdValue = Number(usd_amount);
    const satoshis = Math.round((usdValue / btcPrice) * 100000000);
    
    if (satoshis < 1) {
        return res.status(400).json({ success: false, error: "Monto muy bajo para ser cobrado en satoshis." });
    }

    const memo = description || `Pasaje Bus - $${usdValue} USD`;

    // 2. Llamada a la API de SatsPayServer para crear el Cargo
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
    
    // 3. LLAMADA ADICIONAL: Obtener los detalles del Cargo para extraer la cadena del QR
    const chargeDetails = await getChargeDetails(chargeId);
    
    if (!chargeDetails) {
        return res.status(500).json({ success: false, error: "Cargo creado pero detalles inaccesibles para QR." });
    }
    
    // Devolvemos el payment_request (BOLT11/LNURL) para que el Frontend lo codifique
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