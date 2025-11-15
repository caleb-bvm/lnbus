import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.92:3000/api'; 
const TOP_UP_AMOUNT_SATS = 16666; 

const TopUpModal = ({ isOpen, onClose, onTopUpSuccess }) => {
    const [amountSelection, setAmountSelection] = useState(TOP_UP_AMOUNT_SATS); 
    const [topUpToken, setTopUpToken] = useState(null);
    const [status, setStatus] = useState('Selecciona un monto y presiona GENERAR.');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const generateToken = () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    };

    const handleGenerateToken = () => {
        setTopUpToken(generateToken());
        setStatus(`Token generado. Muestra el código al cajero y paga.`);
    };

    const handleCASHIN = async () => {
        if (!topUpToken) return;

        setIsLoading(true);
        setStatus(`Validando depósito con token ${topUpToken}...`);

        try {
            const response = await axios.post(`${API_BASE_URL}/passenger/topup`, {
                token: topUpToken,
                amount: TOP_UP_AMOUNT_SATS
            });

            if (response.data.success) {
                onTopUpSuccess(); 
                setStatus(`✅ ¡Recarga de ${TOP_UP_AMOUNT_SATS} sats completada!`);
                setTimeout(onClose, 2500);
            }

        } catch (error) {
            console.error("Error en la recarga:", error);
            setStatus(`❌ Error: ${error.response?.data?.detail || 'Fallo al conectar con el servidor.'}`);
        } finally {
            setIsLoading(false);
            setTopUpToken(null);
        }
    };
    
    const handleCloseModal = () => {
        setAmountSelection(TOP_UP_AMOUNT_SATS);
        setTopUpToken(null);
        setStatus('Selecciona un monto y presiona GENERAR.');
        setIsLoading(false);
        onClose();
    };

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
                <button onClick={handleCloseModal} style={modalStyles.closeButton}>
                    &times;
                </button>
                <h2>🪙 Agregar Fondos (Punto Express)</h2>
                
                {topUpToken ? (
                    <div style={modalStyles.tokenBox}>
                        <p style={modalStyles.tokenLabel}>Muestra este TOKEN al cajero:</p>
                        <h1 style={modalStyles.tokenValue}>{topUpToken}</h1>
                        <p style={modalStyles.statusTextToken}>{status}</p>
                        <button 
                            onClick={handleCASHIN}
                            style={modalStyles.confirmButton}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Confirmando...' : 'Confirmar Depósito'}
                        </button>
                    </div>
                ) : (
                    <div style={modalStyles.selectionBox}>
                        <p>Monto de Recarga (Simulado):</p>
                        <select 
                            value={amountSelection} 
                            onChange={(e) => setAmountSelection(parseInt(e.target.value))}
                            style={modalStyles.select}
                            disabled={isLoading}
                        >
                            <option value={16666}>$10 USD (16,666 sats)</option>
                            <option value={8333}>$5 USD (8,333 sats)</option>
                            <option value={33333}>$20 USD (33,333 sats)</option>
                        </select>

                        <button 
                            onClick={handleGenerateToken}
                            style={modalStyles.generateButton}
                            disabled={isLoading || amountSelection === 0}
                        >
                            GENERAR TOKEN DE RECARGA
                        </button>
                        <p style={modalStyles.statusText}>{status}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const modalStyles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '450px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        textAlign: 'center',
        position: 'relative',
        fontFamily: 'Roboto, Arial, sans-serif',
        color: '#1a1a1a',
    },
    closeButton: {
        position: 'absolute',
        top: '15px',
        right: '15px',
        fontSize: '1.5em',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#625B71',
    },
    selectionBox: {
        marginTop: '20px',
    },
    select: {
        padding: '10px 15px',
        borderRadius: '8px',
        border: '2px solid #6750A4',
        fontSize: '1em',
        width: '100%',
        marginBottom: '20px',
        fontWeight: 'bold',
    },
    generateButton: {
        backgroundColor: '#FF9900',
        color: 'white',
        border: 'none',
        padding: '12px 25px',
        borderRadius: '30px',
        fontWeight: '700',
        cursor: 'pointer',
        fontSize: '1em',
        width: '100%',
        marginBottom: '15px',
    },
    statusText: {
        fontSize: '0.9em',
        color: '#007bff',
        marginTop: '10px',
    },
    statusTextToken: {
        fontSize: '0.9em',
        color: '#FF9900',
        marginTop: '10px',
    },
    tokenBox: {
        backgroundColor: '#6750A4',
        color: 'white',
        padding: '25px',
        borderRadius: '12px',
        marginTop: '20px',
    },
    tokenLabel: {
        margin: '0',
        fontSize: '1em',
    },
    tokenValue: {
        margin: '10px 0 20px',
        fontSize: '2.5em',
        letterSpacing: '5px',
        fontWeight: '900',
    },
    confirmButton: {
        backgroundColor: '#FF9900',
        color: 'white',
        border: 'none',
        padding: '15px 30px',
        borderRadius: '30px',
        fontWeight: '900',
        cursor: 'pointer',
        fontSize: '1.1em',
        width: '100%',
    },
};

export default TopUpModal;
