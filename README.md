# ⚡ LightningBus.io - Sistema de Pago de Pasajes con Bitcoin Lightning

Este proyecto implementa un sistema de pago de pasajes para autobuses utilizando la red Bitcoin Lightning a través de la plataforma de gestión de monederos LNBits. El objetivo principal es ofrecer una solución de cobro eficiente con liquidación automática de fondos.

---

## 🚀 Instalación y Configuración del Entorno

Sigue estos pasos para configurar el backend (Node.js/Express) y conectarlo a tu instancia de LNBits.

### 1. Requisitos Previos

Asegúrate de tener las siguientes extensiones activas en tu monedero principal de LNBits:

* **SatsPayServer:** Requerida para generar las facturas de cobro (códigos QR).
* **Split Payments:** Requerida para configurar la liquidación automática de fondos entre monederos.

### 2. Archivo de Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto y complétalo con tus claves y URLs de LNBits.

```env
# URL base de tu instancia de LNBITS
LNBITS_BASE_URL=[http://chirilicas.com:5000]

# Monedero principal del Bus (Fuente de los cargos)
BUS_ADMIN_KEY="f55682d14a044ba88060411fadd61023"
WALLET_ID="b1cfa446ed1448339eba3e3518173775"

# Monedero del Pasajero (Utilizado para simular pagos y recargas)
PASSENGER_ADMIN_KEY="cfa31024ff8a49dea9c7dc849df53895"
PASSENGER_INVOICE_KEY="db2b55de024c4b5abb2f7e32cd7622da"

# Configuración de los monederos dentro de Split Payments 
# SPLIT_WALLET_A_ID="..." 
# SPLIT_WALLET_B_ID="..." 
````

### 3\. Ejecución del Backend

1.  Instala las dependencias: `npm install`
2.  Inicia el servidor: `npm start`

El backend se iniciará en el puerto `3000`.

-----

## 🚀 Funcionalidad del Sistema

El sistema ofrece una solución de pago de pasajes totalmente automatizada, centralizada en la lógica del controlador (`controllers/busController.js`).

### I. Flujo de Cobro (Wallet del Bus)

| Endpoint | Método | Descripción | Tecnología Principal |
| :--- | :--- | :--- | :--- |
| `/api/bus/invoice` | `POST` | Genera una factura Lightning (QR) para el pasaje basándose en un monto en USD, utilizando el precio actual de Bitcoin (Coingecko API). | **SatsPayServer** |
| `/api/bus/payments` | `GET` | Recupera el historial de pagos de pasajes completados, utilizado para poblar el dashboard del Bus. | **SatsPayServer** |

### II. Flujo del Pasajero (Wallet del Pasajero)

| Endpoint | Método | Descripción |
| :--- | :--- | :--- |
| `/api/passenger/balance` | `GET` | Consulta el saldo del monedero del pasajero. |
| `/api/passenger/decode` | `POST` | Decodifica la factura BOLT11 del bus para verificar el monto a pagar. |
| `/api/passenger/pay` | `POST` | Realiza el pago de la factura al Bus. |
| `/api/passenger/topup` | `POST` | Simula una recarga de saldo en el monedero del pasajero. |

### III. División de Pagos (Split Payments)

El proyecto está diseñado para integrar la liquidación automática de fondos utilizando la extensión **Split Payments**.

  * La configuración de la división de pagos (ej. 60% para el Conductor, 40% para la Cooperativa) se realiza directamente en el dashboard de LNBits.
  * Debido a dependencias de entorno, la creación de la factura se realiza a través de SatsPayServer, pero la funcionalidad de liquidación de fondos puede ser demostrada a través de la interfaz de la extensión Split Payments, utilizando la función de **transferencia programada** o **liquidación diaria** sobre los fondos recibidos por el monedero del Bus.

# ⚡ Grupo 24 BLOCK ZERO