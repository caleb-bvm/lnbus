import React from 'react';
import FareManager from './components/FareManager.jsx';
import PaymentDashboard from './components/PaymentDashboard.jsx';

// CRÍTICO: El componente EnterpriseFooter ha sido eliminado de aquí.


function App() {
  return (
    // Contenedor principal ajustado para Pantalla Completa y BOLD
    <div style={appStyles.fullScreenContainer}>
      
      <header style={appStyles.header}>
          <img
            src="/LightningBus.svg"
            alt="Lightning Bus Logo"
            style={appStyles.logoPlaceholder}
          />
          <h1 style={appStyles.headerTitle}>Powered by Lightning ⚡ Network <br /> Made for Node Nation 🌋</h1>
      </header>
      
      <main style={appStyles.mainContent}>
        {/* MÓDULO 1: TARIFAS Y QR (1/3) */}
        <section style={appStyles.fareSection}>
          <FareManager />
        </section>
        
        {/* MÓDULO 2: REGISTRO DE PAGOS (2/3) */}
        <section style={appStyles.dashboardSection}>
          <PaymentDashboard />
        </section>
      </main>

      {/* CRÍTICO: La llamada al componente <EnterpriseFooter /> ha sido eliminada. */}
      
    </div>
  );
}

const appStyles = {
    fullScreenContainer: {
        width: '100vw', 
        // Ya que eliminamos el footer, minHeight puede volver a 100vh
        minHeight: '100vh', 
        padding: 0,
        margin: 0,
        boxSizing: 'border-box',
        backgroundColor: '#F7F7F7', 
        fontFamily: 'Roboto, Arial, sans-serif',
        fontWeight: 'bold', 
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        backgroundColor: '#FFFFFF',
        padding: '20px 40px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        color: '#333',
        fontWeight: '900', 
        fontSize: '1.5em',
    },
    logoPlaceholder: {
        width: 'auto', // Ajusta este valor al tamaño final deseado
        height: '120px',
        objectFit: 'contain',
    },
    mainContent: {
        flexGrow: 1, 
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '24px',
        padding: '24px 30px',
        alignItems: 'stretch',
    },
    fareSection: {
        // ...
    },
    dashboardSection: {
        // ...
    },
    // CRÍTICO: Los estilos del footer han sido eliminados.
};

export default App;