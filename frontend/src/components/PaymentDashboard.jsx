import React, { useState, useEffect, useRef } from 'react'; 
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api'; 

const PaymentDashboard = () => {
    const [payments, setPayments] = useState([]);
    const [isPaymentReceived, setIsPaymentReceived] = useState(false); 
    const paidCountRef = useRef(0); 

    const fetchPayments = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/payments`);
            let currentPayments = response.data.payments;
            
            currentPayments.sort((a, b) => b.time - a.time); 
            
            const paidPayments = currentPayments.filter(p => p.status === 'paid');
            const newPaidCount = paidPayments.length;

            if (newPaidCount > paidCountRef.current) {
                setIsPaymentReceived(true); 
                setTimeout(() => setIsPaymentReceived(false), 3000); 
            }
            paidCountRef.current = newPaidCount;
            
            setPayments(currentPayments);

        } catch (error) {
            console.error("Error al obtener pagos:", error);
        }
    };

    useEffect(() => {
        setTimeout(fetchPayments, 0); 
        const intervalId = setInterval(fetchPayments, 5000); 
        return () => clearInterval(intervalId);
    }, []); 

    const getStatusText = (payment) => {
        if (payment.status === 'paid') return 'Pagado ✅';
        if (payment.status === 'pending') return 'Pendiente...';
        if (payment.status === 'expired') return 'Expirado ❌';
        return '---';
    };

    const getStatusStyle = (payment) => {
        let color = '#333';
        let bgColor = '#f0f0f0';

        if (payment.status === 'paid') {
            color = '#155724';
            bgColor = '#D4EDDA';
        } else if (payment.status === 'pending') {
            color = '#856404';
            bgColor = '#FFF3CD';
        } else if (payment.status === 'expired') {
            color = '#721C24';
            bgColor = '#F8D7DA';
        }
        
        return {
            fontWeight: '800',
            color: color, 
            backgroundColor: bgColor,
            padding: '6px 12px',
            borderRadius: '8px', 
            display: 'inline-block'
        };
    };


    return (
        <div style={dashboardStyles.container}>
            <h2 style={dashboardStyles.title}>📋 Historial de Cargos Recientes</h2>
            
            <div style={{
                ...dashboardStyles.light,
                backgroundColor: isPaymentReceived ? '#FFC107' : '#EAEAEA', 
                color: isPaymentReceived ? '#333' : '#888',
                boxShadow: isPaymentReceived ? '0 0 15px rgba(255, 193, 7, 0.7)' : 'none',
                border: '3px solid #FF9900' 
            }}>
                {isPaymentReceived ? '✅ ¡PASAJE PAGADO!' : 'Monitoreando Pagos...'}
            </div>
            
            <div style={dashboardStyles.tableWrapper}>
                <table style={dashboardStyles.table}>
                    <thead>
                        <tr style={dashboardStyles.tableHeader}>
                            <th style={dashboardStyles.th}>Fecha/Hora</th> 
                            <th style={dashboardStyles.th}>Monto (Sats)</th>
                            <th style={dashboardStyles.th}>Estado</th> 
                            <th style={dashboardStyles.th}>Descripción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((p, index) => (
                            <tr key={p.checking_id || index} style={dashboardStyles.tableRow}>
                                <td style={dashboardStyles.td}>
                                    {p.time && !isNaN(+p.time) && +p.time > 0
                                        ? new Date(parseInt(p.time) * 1000).toLocaleString()
                                        : '---'
                                    }
                                </td>
                                <td style={dashboardStyles.tdAmount}>
                                    {p.amount} sats
                                </td>
                                <td style={dashboardStyles.td}>
                                    <span style={getStatusStyle(p)}>
                                        {getStatusText(p)}
                                    </span>
                                </td>
                                <td style={dashboardStyles.td}>
                                    {p.memo}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const dashboardStyles = {
    container: { 
        padding: '24px', 
        borderRadius: '16px', 
        backgroundColor: '#fff', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        height: '100%'
    },
    title: { color: '#FF9900', marginBottom: '20px', fontWeight: '900', fontSize: '1.5em' },
    light: {
        height: '65px',
        borderRadius: '12px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '900', 
        fontSize: '1.3em',
        marginBottom: '20px',
        transition: 'all 0.3s ease-in-out',
        padding: '0 15px',
        border: '1px solid #ccc'
    },
    tableWrapper: { overflowX: 'auto', borderRadius: '12px', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', borderRadius: '12px' },
    tableHeader: { backgroundColor: '#FF9900', color: 'black' }, 
    th: { padding: '15px 10px', borderBottom: '2px solid #FF9900', textAlign: 'left', fontWeight: '900', fontSize: '1em' },
    tableRow: { borderBottom: '1px solid #E0E0E0', transition: 'background-color 0.2s' },
    td: { padding: '12px 10px', fontSize: '1em', color: '#49454F', fontWeight: '500' },
    tdAmount: { padding: '12px 10px', fontSize: '1.1em', fontWeight: '800', color: '#1a1a1a' }
};

export default PaymentDashboard;
