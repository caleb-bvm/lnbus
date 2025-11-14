# 🚍 Lightning Bus POS (Point of Sale)

Un prototipo de sistema de punto de venta (POS) para autobuses diseñado para aceptar micropagos en **Bitcoin sobre Lightning Network** en El Salvador. El diseño es **BOLD, de alto contraste**, y enfocado en la fiabilidad y la experiencia de usuario (UX) del conductor.

## ✨ Características Principales

  * **Pagos Lightning:** Genera códigos QR de cobro exacto en Satoshis a partir de una tarifa en **USD**.
  * **Notificación Instantánea (Luz Verde):** Utiliza un *polling* robusto que activa una notificación visual solo cuando un pago **pendiente pasa a ser liquidado**.
  * **Historial Fiable:** El *dashboard* muestra el historial de cargos con el estado preciso (`Pagado ✅`, `Pendiente...`, `Expirado ❌`) y la fecha/hora correcta, extrayendo los datos directamente de la API de Cargos de SatsPayServer.

-----

## ⚙️ Instalación y Configuración

El proyecto consta de dos partes: **`backend`** (Node.js/Express) y **`frontend`** (React/Vite).

### 1\. Configuración de LNbits (Requisito Previo)

Asegúrate de tener una instancia de LNbits (o un nodo Lightning con la extensión SatsPayServer activada) y obtener las siguientes claves:

  * **URL Base de LNbits:** Ej. `http://chirilicas.com:5000`
  * **Wallet ID**
  * **Admin Key**

### 2\. Configuración del Backend (Express)

Navega al directorio **`backend`** e instala las dependencias.

```bash
cd backend
npm install
```

Luego, crea o actualiza tu archivo **`.env`** con las credenciales obtenidas:

```env
# -----------------------------------
# CLAVES CRÍTICAS DE LNBITS
# -----------------------------------

# URL de tu nodo LNbits (Ej. http://chirilicas.com:5000)
LNBITS_BASE_URL="[TU_NODE_URL]"

# ID de la Cartera (Necesaria para SatsPayServer)
WALLET_ID="[TU_WALLET_ID]"

# Admin Key de la Cartera (Permite crear facturas)
BUS_ADMIN_KEY="[TU_ADMIN_KEY]"

# URL de Fallback para el Webhook (Aunque no se usa, SatsPayServer la requiere)
BUS_WEBHOOK_URL="http://tuserver.com/api/payment_notification" 

# Puerto del Servidor
PORT=3000
```

### 3\. Instalación del Frontend (React/Vite)

Navega al directorio **`frontend`** e instala las librerías necesarias (incluyendo el generador de QR).

```bash
cd frontend
npm install
# Librerías específicas: axios para peticiones, qrcode.react para la generación del QR en línea.
npm install axios express dotenv qrcode.react
```

-----

## ▶️ Ejecución del Proyecto

Abre dos terminales y corre ambos servidores simultáneamente.

### 1\. Iniciar el Backend (Terminal 1)

Navega a la carpeta **`backend`** y ejecuta:

```bash
npm start
```

### 2\. Iniciar el Frontend (Terminal 2)

Abre otra terminal, navega a la carpeta **`frontend`** y ejecuta:

```bash
npm run dev
```

*La aplicación de React se abrirá automáticamente en tu navegador (usualmente `http://localhost:5173`).*

-----

## 📝 Demo y Uso

1.  **Establecer Tarifa:** En el *dashboard* (lado izquierdo), ingresa la tarifa deseada en **USD** (ej., `0.45`).
2.  **Generar QR:** Haz clic en **"GENERAR NUEVO QR"**. El QR se actualiza inmediatamente con la nueva tarifa en Satoshis.
3.  **Proceso de Pago y Monitoreo:**
      * El pasajero escanea el QR con su cartera Lightning.
      * La transacción aparece en la tabla como **`Pendiente...`** (Estado Amarillo).
      * Una vez que el pago se liquida en la red Lightning (cada 5 segundos), la **"Luz Verde"** se activa y la transacción en la tabla cambia a **`Pagado ✅`**.
