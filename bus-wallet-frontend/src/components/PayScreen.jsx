import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QrReader } from 'react-qr-reader';
import TopUpModal from './TopUpModal';

const API_BASE_URL = 'http://192.168.1.92:3000/api';
const CAMERA_FEED_WIDTH = 300;

const PayScreen = () => {
    const [balance, setBalance] = useState(0);
    const [scanResult, setScanResult] = useState('');
    const [status, setStatus] = useState('Cargando saldo y esperando QR...');
    const [amountDue, setAmountDue] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // FUNCIÓN CENTRAL: DECODIFICA LA FACTURA LLAMANDO AL BACKEND
    const decodeInvoice = async (bolt11_invoice) => {
        setAmountDue(0); 
        setStatus(`QR detectado. Decodificando monto... 🔄`);
        
        try {
            const response = await axios.post(`${API_BASE_URL}/passenger/decode-invoice`, {
                bolt11_invoice: bolt11_invoice
            });
            
            const decodedAmount = response.data.amount_sats;
            
            if (decodedAmount > 0) {
                setAmountDue(decodedAmount);
                setStatus(`✅ Monto a pagar: ${decodedAmount.toLocaleString()} sats. Confirma el pago.`);
            } else {
                setAmountDue(0); 
                setStatus(`⚠️ Factura sin monto. El pago se realiza por el saldo restante del pasaje.`);
            }

        } catch (error) {
            console.error("Error decodificando la factura:", error);
            setStatus(`❌ ERROR: Factura no válida o fallo de red. (${error.response?.data?.detail || 'Inténtalo de nuevo.'})`);
            setScanResult(''); 
            setAmountDue(0);
        }
    };
    
    const fetchBalance = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/passenger/balance`);
            setBalance(response.data.balance);
            setStatus(`Saldo cargado. ¡Listo para usar!`);
        } catch (error) {
            console.error("Error cargando balance:", error);
            setStatus('❌ ERROR: No se pudo conectar con la cartera.');
        }
    };

    useEffect(() => {
        fetchBalance();
        const intervalId = setInterval(fetchBalance, 10000);
        return () => clearInterval(intervalId);
    }, []);

    const handleTopUpSuccess = () => {
        fetchBalance();
        setStatus('✅ ¡Recarga de fondos completada con éxito!');
    };

    const handleScan = (result, error) => {
        if (!!result) {
            const qrContent = result?.text;

            if (qrContent && qrContent.startsWith('lnbc')) {
                setScanResult(qrContent);
                decodeInvoice(qrContent);
            }
        }
    };
    
    const handleError = (err) => {
        console.error("Error de Cámara/QR Reader:", err);
        setStatus(`❌ ERROR DE CÁMARA: Verifica los permisos del navegador. ${err.message || ''}`);
    };


    const handlePay = async () => {
        if (!scanResult || amountDue === 0) {
            setStatus('Por favor, escanea un QR válido.');
            return;
        }

        if (balance < amountDue) {
            setStatus('❌ Error: Saldo insuficiente. Recarga tu Bus Wallet.');
            return;
        }

        setStatus(`Pagando ${amountDue.toLocaleString()} sats... 🚀`);

        try {
            const response = await axios.post(`${API_BASE_URL}/passenger/pay`, {
                bolt11_invoice: scanResult
            });

            const paidAmount = response.data.amount_sats;
            setStatus(`✅ ¡Pago Exitoso! Pagaste ${paidAmount.toLocaleString()} sats.`);
            setAmountDue(0);
            setScanResult('');
            fetchBalance();

        } catch (error) {
            console.error("Error de pago:", error);
            setStatus(`❌ Error de Pago: ${error.response?.data?.detail || 'Inténtalo de nuevo.'}`);
        }
    };

    return (
        <div style={payStyles.container}>
            <h1 style={payStyles.title}>
                <img src="/Wallet.svg" alt="Bus Wallet Logo" style={payStyles.logo} />
            </h1>

            <div style={payStyles.balanceBox}>
                <p style={payStyles.balanceLabel}>Tu Saldo:</p>
                <p style={payStyles.balanceAmount}>{balance.toLocaleString()} ⚡ sats</p>

                <div style={payStyles.staticContentWrapper}>
                    <button onClick={() => setIsModalOpen(true)} style={payStyles.rechargeButton}>
                        + Agregar Fondos (Punto Express/Chivo ATM)
                    </button>
                </div>
            </div>

            <div style={payStyles.paymentArea}>
                <p style={payStyles.instruction}>Apunta la cámara al QR del bus.</p>

                <div style={payStyles.qrReaderContainer}>
                    {scanResult === '' ? (
                        <QrReader
                            onResult={handleScan}
                            onError={handleError}
                            constraints={{ facingMode: "environment" }}
                            scanDelay={200}
                            containerStyle={{
                                width: "100%",
                                height: "100%",
                                position: "absolute"
                            }}
                            videoContainerStyle={{
                                width: "100%",
                                height: "100%",
                                position: "absolute"
                            }}
                            videoStyle={{
                                width: "100% !important",
                                height: "100% !important",
                                position: "absolute",
                                top: 0,
                                left: 0,
                                objectFit: "cover",
                                zIndex: 9999,
                                display: "block",
                                opacity: 1,
                                visibility: "visible"
                            }}
                        />
                    ) : (
                        <div style={payStyles.scanResultDisplay}>
                            <p>Código Escaneado:</p>
                            <p style={payStyles.scannedInvoiceText}>{scanResult.substring(0, 30)}...</p>
                        </div>
                    )}
                </div>

                {scanResult && (
                    <div style={payStyles.confirmationBox}>
                        <p style={payStyles.confirmationText}>Monto a pagar: <span style={payStyles.amountDue}>{amountDue.toLocaleString()} sats</span></p>
                        <button
                            onClick={handlePay}
                            style={payStyles.payButton}
                            disabled={amountDue <= 0 || balance < amountDue}
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

                <p style={payStyles.statusText}>Estado: {status}</p>
            </div>

            <TopUpModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTopUpSuccess={handleTopUpSuccess}
            />
        </div>
    );
};

const payStyles = {
    container: { maxWidth: '500px', margin: '30px auto', padding: '25px', borderRadius: '16px', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: 'Roboto, Arial, sans-serif', fontWeight: 'bold' },
    title: {
        textAlign: 'center',
        color: '#FF9900',
        fontWeight: '900',
        borderBottom: '2px solid #FF9900',
        paddingBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px'
    },
    logo: {
        width: 'auto',
        height: '140px',
    },
    balanceBox: {
        padding: '20px',
        backgroundColor: '#FFFBEB',
        borderRadius: '12px',
        textAlign: 'center',
        margin: '20px 0',
        border: '2px solid #FF9900',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    staticContentWrapper: {
        width: '100%',
        padding: '10px 0'
    },

    balanceLabel: { fontSize: '1em', color: '#625B71', margin: '0' },
    balanceAmount: { fontSize: '2.5em', fontWeight: '900', color: '#FF9900', margin: '5px 0' },

    rechargeButton: {
        backgroundColor: '#FF9900',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '20px',
        fontWeight: '700',
        cursor: 'pointer',
    },

    paymentArea: { marginTop: '30px', padding: '15px', border: '1px solid #DDD', borderRadius: '12px', color: '#1a1a1a' },
    instruction: { fontSize: '0.9em', color: '#555', marginBottom: '15px', textAlign: 'center' },
    qrReaderContainer: { 
        position: 'relative',
        zIndex: 1,
        width: CAMERA_FEED_WIDTH, 
        height: CAMERA_FEED_WIDTH, 
        margin: '0 auto', 
        overflow: 'hidden',
        border: '3px solid #6750A4', 
        borderRadius: '8px' 
    },
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