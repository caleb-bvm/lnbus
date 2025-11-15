import React from 'react';
import FareManager from './components/FareManager.jsx';
import PaymentDashboard from './components/PaymentDashboard.jsx';

function App() {
  return (
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
        <section style={appStyles.fareSection}>
          <FareManager />
        </section>

        <section style={appStyles.dashboardSection}>
          <PaymentDashboard />
        </section>
      </main>
    </div>
  );
}

const appStyles = {
  fullScreenContainer: {
    width: '100vw',
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
    width: 'auto',
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
  fareSection: {},
  dashboardSection: {},
};

export default App;
