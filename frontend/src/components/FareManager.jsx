import React, { useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react'; 

const API_BASE_URL = 'http://localhost:3000/api'; 

const FareManager = () => {
    const [usdFare, setUsdFare] = useState('');
    const [qrContent, setQrContent] = useState(null); 
    const [status, setStatus] = useState('Listo para establecer tarifa.');
    const [satoshisAmount, setSatoshisAmount] = useState(null);

    const handleUpdateFare = async () => {
        if (!usdFare || isNaN(usdFare) || Number(usdFare) <= 0) {
            alert('Por favor, ingresa una tarifa válida.');
            return;
        }

        setStatus('Generando nuevo QR...');

        try {
            const response = await axios.post(`${API_BASE_URL}/lnurlpay`, { 
                usd_amount: usdFare,
                description: `Pasaje Ruta ${new Date().toLocaleDateString()}`
            });

            setQrContent(response.data.qr_content); 
            setSatoshisAmount(response.data.satoshis_amount);
            
            setStatus(`QR actualizado a $${usdFare} USD (${response.data.satoshis_amount} sats).`);

        } catch (error) {
            console.error("Error al actualizar la tarifa:", error);
            const errorMessage = error.response?.data?.detail?.detail || error.response?.data?.error || error.message;
            setStatus(`ERROR: ${errorMessage}`);
            setQrContent(null);
            setSatoshisAmount(null);
        }
    };

    return (
        <div style={fareManagerStyles.container}>
            <h2 style={fareManagerStyles.title}>💵 Establecer Tarifa</h2>
            
            <div style={fareManagerStyles.inputGroup}>
                <span style={fareManagerStyles.currencySymbol}>$</span>
                <input
                    type="number"
                    step="0.01"
                    placeholder="0.50"
                    value={usdFare}
                    onChange={(e) => setUsdFare(e.target.value)}
                    style={fareManagerStyles.input}
                />
            </div>
            
            <button 
                onClick={handleUpdateFare}
                style={fareManagerStyles.button}
            >
                GENERAR NUEVO QR
            </button>
            
            <p style={{ ...fareManagerStyles.statusText, textAlign: 'center' }}>Estado: {status}</p>

            {qrContent && ( 
                <div style={{ ...fareManagerStyles.qrBox, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={fareManagerStyles.qrTitle}>ESCANEAR PARA PAGAR</h3>
                    
                    {/* Monto Grande y Visible */}
                    <div style={{ ...fareManagerStyles.amountDisplay, textAlign: 'center' }}>
                        <span style={fareManagerStyles.amountUsd}>${usdFare}</span>
                        <span style={fareManagerStyles.amountSats}> ({satoshisAmount} sats)</span>
                    </div>

                    {/* Generación del QR en línea con QRCodeSVG */}
                    <div style={fareManagerStyles.qrCanvas}>
                        <QRCodeSVG 
                            value={qrContent}
                            size={400} 
                            level="H"
                            includeMargin={false}
                            fgColor="#1a1a1a"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// Estilos Minimalistas BOLD
const fareManagerStyles = {
    container: { 
        padding: '24px', 
        borderRadius: '16px', 
        backgroundColor: '#fff', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start'
    },
    title: { marginBottom: '30px', color: '#1a1a1a', fontWeight: '900', fontSize: '1.5em' },
    inputGroup: { 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: '40px',
        width: '80%',
        maxWidth: '300px',
        borderBottom: '3px solid #FF9900',
        transition: 'border-bottom 0.3s'
    },
    currencySymbol: { 
        fontSize: '3.5em', 
        fontWeight: '900', 
        marginRight: '10px', 
        color: '#555' 
    },
    input: { 
        fontSize: '3.5em', 
        padding: '5px 0', 
        border: 'none', 
        outline: 'none',
        textAlign: 'center',
        width: '100%',
        fontWeight: '900',
        backgroundColor: 'transparent',
        color: '#555555'
    },
    button: { 
        fontSize: '1.2em', 
        padding: '16px 30px', 
        backgroundColor: '#FF9900', 
        color: 'white', 
        border: 'none', 
        borderRadius: '30px', 
        cursor: 'pointer', 
        width: '80%',
        maxWidth: '300px',
        fontWeight: '900',
        marginBottom: '30px'
    },
    statusText: { marginTop: '10px', fontWeight: '700', color: '#555' },
  qrBox: { 
        marginTop: '25px', 
        padding: '36px', 
        borderRadius: '20px', 
        backgroundColor: '#FFFCF0', 
        boxShadow: '0 6px 30px rgba(255,153,0,0.22)', 
        width: '95%', 
        maxWidth: '520px', // Aumentado ligeramente para el QR más grande
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    qrTitle: { color: '#FF9900', marginBottom: '18px', fontSize: '1.4em', fontWeight: '900' },
    amountDisplay: { marginBottom: '18px' },
    amountUsd: { fontSize: '4.5em', fontWeight: '900', color: '#1a1a1a' }, // Aumentado
    amountSats: { fontSize: '1.6em', color: '#555', fontWeight: '700' }, // Aumentado
    qrCanvas: { 
        display: 'flex', 
        justifyContent: 'center', 
        padding: '14px', 
        backgroundColor: 'white', 
        borderRadius: '10px',
        margin: '12px auto',
        width: 'fit-content'
    }
};

export default FareManager;