# Boutique de Perfumes - SPA con Google Sheets

Tienda online de perfumes de lujo, construida como Single Page Application (SPA) conectada a Google Sheets como backend.

## ✨ Características

- **Diseño Luxury Minimalist**: Estética elegante y sofisticada
- **Catálogo dinámico**: Productos cargados desde Google Sheets
- **Filtros inteligentes**: Por marca, tipo y género en tiempo real
- **Carrito interactivo**: Con efectos Glassmorphism y cálculo automático
- **WhatsApp Checkout**: Genera pedido listo para enviar por WhatsApp
- **Responsive**: Adaptado para móviles, tablets y escritorio
- **Skeleton Loader**: Estado de carga visual agradable

## 🚀 Guía de Configuración Rápida

### 1. Preparar Google Sheets

1. Crea un Google Sheet con estas columnas (orden exacto):
   - **A**: SKU (Código del producto)
   - **B**: Nombre del perfume
   - **C**: Marca
   - **D**: Tipo (Eau de Parfum, Eau de Toilette, etc.)
   - **E**: Género (Masculino, Femenino, Unisex)
   - **F**: Precio (número, ej: 45.99)
   - **G**: Descripción
   - **H**: Stock (número entero)
   - **I**: URL de la imagen (debe ser accesible públicamente)
   - **J**: Categoría adicional (opcional)

3. Implementa un script en **Extensiones → Apps Script** que devuelva los datos en formato JSON (Array de objetos).
4. Despliega como **Aplicación Web** con acceso para "Cualquiera".
5. Copia la URL de la aplicación web generada.

### 2. Configurar el proyecto

1. Abre `js/app.js`
2. Reemplaza las variables al inicio del archivo:
   ```javascript
   const API_URL = "TU_URL_DE_APPS_SCRIPT_AQUI"; // ← PEGA TU URL DE APP WEB
   const WHATSAPP_PHONE = "595974666221";        // ← TU NÚMERO CON CÓDIGO DE PAÍS
   ```

3. Guarda los cambios y abre `index.html` en tu navegador

## 📁 Mapa de Arquitectura

```
Web/
├── index.html          # Estructura principal (SPA)
├── css/
│   └── style.css       # Estilos Luxury Minimalist + Glassmorphism
├── js/
│   └── app.js          # Motor: API, filtros, carrito, WhatsApp
└── README.md           # Esta documentación
```

### Flujo de Datos
```
Google Sheets (CSV) 
        ↓
fetchInventory() → Procesa datos
        ↓
renderProducts() → Genera tarjetas dinámicas
        ↓
filterSystem()   → Filtra en tiempo real (Marca/Tipo/Género)
        ↓
cartLogic()      → Gestión del carrito (GSL)
        ↓
whatsappCheckout() → Genera mensaje profesional para WhatsApp
```

## 🛠️ Tecnologías Utilizadas

- **HTML5** + **CSS3** (Grid, Flexbox, Variables CSS)
- **JavaScript Vanilla** (ES6+)
- **Google Sheets API** (vía CSV publish-to-web)
- **WhatsApp Web API** (para generar enlaces de mensaje)
- **Glassmorphism** y efectos hover suaves
- **Lazy Loading** de imágenes nativo
- **Diseño Responsivo** (Mobile-first)

## 📱 Responsive Breakpoints

- **Móvil**: < 640px (1 columna en grid)
- **Tablet**: 640px - 1024px (2 columnas en grid)
- **Escritorio**: > 1024px (3-4 columnas en grid)

## 💡 Personalización

### Colores (en `css/style.css`)
```css
:root {
  /* Fondo principal y superficies */
  --color-bg: #FCFCFC;         /* Off-White Luminoso (Fondo global) */
  --color-surface: #F1ECF5;    /* Blanco Mandala (Tarjetas y secciones) */
  
  /* Textos y contrastes */
  --color-text: #222222;       /* Carbón Negro (Títulos y párrafos) */
  --color-text-muted: #A791B1; /* Gris Malva (Textos secundarios y detalles) */
  
  /* Acentos de Marca */
  --color-accent: #DFB9E5;     /* Lavanda Pincelado (Botones y destacados) */
  --color-accent-dark: #A791B1;/* Gris Malva (Bordes y acentos sobrios) */
  
  /* Efectos Especiales */
  --color-glass: rgba(241, 236, 245, 0.7); /* Glassmorphism basado en el tono Mandala */
  --shadow-soft: 0 4px 15px rgba(167, 145, 177, 0.15); /* Sombra suave en tono malva */
}
```

### Tipografía
- Títulos: Fuente Serif (Lujo)
- Cuerpo: Fuente Sans-serif (Legibilidad)

## ⚙️ Desarrollo

Para ejecutar localmente:
1. Clona o descarga este repositorio
2. Configura `API_URL` y `WHATSAPP_PHONE` en `js/app.js`
3. Abre `index.html` en Firefox, Chrome o Safari
4. (Opcional) Usa `live-server` o similar para desarrollo

```
# Con Node.js
npx live-server
```

## 📞 Soporte

¿Problemas con la conexión a Google Sheets?
- Verifica que la hoja esté publicada como CSV
- Confirma que las columnas estén en el orden correcto (A-J)
- Asegúrate de que las imágenes sean accesibles públicamente

¿El WhatsApp no abre?
- Verifica el formato del número: `54911XXXXXXXX` (sin espacios, sin +)
- Prueba primero con tu propio número

---

**Hecho con ❤️ para amantes de la perfumería**
*Single Page Application conectada a Google Sheets - Llave en Mano*