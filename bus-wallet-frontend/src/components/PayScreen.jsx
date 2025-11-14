import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QrReader } from 'react-qr-reader'; 

const API_BASE_URL = 'http://localhost:3000/api'; 
const CAMERA_FEED_WIDTH = 300; 

const PayScreen = () => {
    // CAMBIO CLAVE: Iniciamos el balance en 0 (cero)
    const [balance, setBalance] = useState(0); 
    const [scanResult, setScanResult] = useState(''); 
    const [status, setStatus] = useState('Cargando saldo y esperando QR...');
    const [amountDue, setAmountDue] = useState(0);

    // FUNCIÓN PARA CONSULTAR EL SALDO REAL
    const fetchBalance = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/passenger/balance`);
            setBalance(response.data.balance);
            setStatus(`Saldo cargado. ¡Listo para usar!`);
        } catch (error) {
            console.error("Error cargando balance:", error);
            setStatus('❌ ERROR: No se pudo conectar con la cartera. Revisa la clave en el .env.');
        }
    };

    useEffect(() => {
        // Cargar el saldo al iniciar
        fetchBalance();
        
        // Polling del saldo cada 10 segundos
        const intervalId = setInterval(fetchBalance, 10000); 
        return () => clearInterval(intervalId);
    }, []);

    // Función que se llama cuando el lector detecta un código QR
    const handleScan = (result, error) => {
        if (!!result) {
            const qrContent = result?.text;
            
            if (qrContent && qrContent.startsWith('lnbc')) {
                setScanResult(qrContent);
                // Simulación de monto ya que la decodificación es compleja en el frontend
                setAmountDue(Math.floor(Math.random() * 500) + 50); 
                setStatus(`QR detectado. Monto aproximado a pagar: ${amountDue} sats.`);
            }
        }
    };
    
    // Función que llama al backend para realizar el pago (Flujo REAL)
    const handlePay = async () => {
        if (!scanResult || amountDue === 0) {
            setStatus('Por favor, escanea un QR válido primero.');
            return;
        }

        if (balance < amountDue) {
            setStatus('❌ Error: Saldo insuficiente. Recarga tu Bus Wallet.');
            return;
        }

        setStatus(`Pagando ${amountDue} sats...`);

        try {
            const response = await axios.post(`${API_BASE_URL}/passenger/pay`, {
                bolt11_invoice: scanResult 
            });

            // Éxito:
            const paidAmount = response.data.amount_sats;
            setStatus(`✅ ¡Pago Exitoso! Pagaste ${paidAmount} sats.`);
            setBalance(prev => prev - paidAmount); // Actualizar balance inmediatamente
            setAmountDue(0);
            setScanResult('');
            // Vuelve a consultar el balance real (opcional, pero buena práctica)
            fetchBalance(); 

        } catch (error) {
            console.error("Error de pago:", error);
            setStatus(`❌ Error de Pago: ${error.response?.data?.detail || 'Inténtalo de nuevo.'}`);
        }
    };

    return (
        <div style={payStyles.container}>
            <h1 style={payStyles.title}>Bus Wallet</h1>
            
            <div style={payStyles.balanceBox}>
                <p style={payStyles.balanceLabel}>Tu Saldo:</p>
                <p style={payStyles.balanceAmount}>{balance.toLocaleString()} ⚡ sats</p>
                <button style={payStyles.rechargeButton}>+ Recargar en Chivo ATM</button>
                <button style={payStyles.rechargeButton}>+ Recargar en Punto Express</button>
                <button style={payStyles.rechargeButton}>+ Recargar con Tarjeta Crédito</button>


            </div>

            <div style={payStyles.paymentArea}>
                <h2>Pagar Pasaje al Bus</h2>
                <p style={payStyles.instruction}>Apunta la cámara al QR del bus.</p>
                
                {/* LECTOR QR DE CÁMARA WEB */}
                <div style={payStyles.qrReaderContainer}>
                    {scanResult === '' ? (
                        <QrReader
                            onResult={handleScan}
                            constraints={{ facingMode: 'environment' }}
                            scanDelay={500}
                            style={{ width: CAMERA_FEED_WIDTH, margin: '0 auto' }}
                        />
                    ) : (
                        <div style={payStyles.scanResultDisplay}>
                            <p>Código Escaneado:</p>
                            <p style={payStyles.scannedInvoiceText}>{scanResult.substring(0, 30)}...</p>
                        </div>
                    )}
                </div>
                
                {/* CONFIRMACIÓN Y BOTÓN DE PAGO */}
                {scanResult && (
                    <div style={payStyles.confirmationBox}>
                        <p style={payStyles.confirmationText}>Monto a pagar: <span style={payStyles.amountDue}>{amountDue} sats</span></p>
                        <button 
                            onClick={handlePay}
                            style={payStyles.payButton}
                            disabled={balance < amountDue}
                        >
                            PAGAR AHORA
                        </button>
                        <button 
                            onClick={() => {setScanResult(''); setAmountDue(0); setStatus('Escaneando QR del Bus...');}}
                            style={payStyles.resetButton}
                        >
                            Escanear de Nuevo
                        </button>
                    </div>
                )}
                
            </div>
        </div>
    );
};

// ... (Resto de estilos payStyles se mantienen)

const payStyles = {
    container: { maxWidth: '500px', margin: '30px auto', padding: '25px', borderRadius: '16px', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: 'Roboto, Arial, sans-serif', fontWeight: 'bold' },
    title: { textAlign: 'center', color: '#FF9900', fontWeight: '900', borderBottom: '2px solid #FF9900', paddingBottom: '10px' },
    balanceBox: { padding: '20px', backgroundColor: '#FFFBEB', borderRadius: '12px', textAlign: 'center', margin: '20px 0', border: '2px solid #FF9900' },
    balanceLabel: { fontSize: '1em', color: '#625B71', margin: '0' },
    balanceAmount: { fontSize: '2.5em', fontWeight: '900', color: '#FF9900', margin: '5px 0' },
    rechargeButton: { backgroundColor: '#FF9900', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' },
    paymentArea: { marginTop: '30px', padding: '15px', border: '1px solid #DDD', borderRadius: '12px' },
    instruction: { fontSize: '0.9em', color: '#555', marginBottom: '15px', textAlign: 'center' },
    qrReaderContainer: { width: CAMERA_FEED_WIDTH + 'px', height: CAMERA_FEED_WIDTH + 'px', margin: '0 auto', overflow: 'hidden', border: '3px solid #6750A4', borderRadius: '8px' },
    scanResultDisplay: { height: CAMERA_FEED_WIDTH + 'px', backgroundColor: '#F0F0F0', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center' },
    scannedInvoiceText: { fontSize: '0.8em', color: '#333', overflowWrap: 'break-word', wordBreak: 'break-all' },
    confirmationBox: { textAlign: 'center', padding: '15px', borderTop: '1px dashed #CCC', marginTop: '10px' },
    confirmationText: { fontSize: '1.2em', fontWeight: '700', color: '#333' },
    amountDue: { color: '#DC3545', fontSize: '1.4em' },
    payButton: { backgroundColor: '#6750A4', color: 'white', border: 'none', padding: '15px 30px', borderRadius: '30px', fontWeight: '900', cursor: 'pointer', marginTop: '15px', fontSize: '1.1em', width: '90%', marginBottom: '10px' },
    resetButton: { backgroundColor: '#ccc', color: '#333', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9em' },
    statusText: { marginTop: '20px', textAlign: 'center', fontWeight: '700', color: '#007bff' }
};

export default PayScreen;