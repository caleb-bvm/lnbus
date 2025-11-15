import React from 'react';
import PayScreen from './components/PayScreen.jsx'; 

function App() {
  return (
    <div style={appStyles.fullScreenContainer}>
      <PayScreen />
    </div>
  );
}

const appStyles = {
    fullScreenContainer: {
        width: '100vw', 
        minHeight: '100vh', 
        padding: '0',
        margin: '0',
        boxSizing: 'border-box',
        backgroundColor: '#F7F7F7', 
        fontFamily: 'Roboto, Arial, sans-serif',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'center', 
        alignItems: 'center',
    },
};

export default App;