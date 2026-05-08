/**
 * Boutique de Perfumes - Motor de la Tienda
 * Single Page Application conectada a Google Apps Script (JSON)
 */

// ============================================
// CONFIGURACIÓN CRÍTICA - EDITAR AQUÍ
// ============================================

const API_URL = "https://script.google.com/macros/s/AKfycbyt7UFotnN9HjHoNvhepdYgh_QRfwHn-hb__v2FQS1lBn5CAY58cEHDlFjx1pvitKwC/exec";
const WHATSAPP_PHONE = "595974666221"; // Formato internacional para Paraguay (595 + número)

// ============================================
// VARIABLES DE ESTADO 
// ============================================

let allProducts = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem('pg_cart')) || [];
let isLoading = true;
let imageUrlCache = new Map();

// ============================================
// DOM Elements
// ============================================

const loadingOverlay = document.getElementById('loadingOverlay');
const productsGrid = document.getElementById('productsGrid');
const searchInput = document.getElementById('searchInput');
const filterBrand = document.getElementById('filterBrand');
const filterType = document.getElementById('filterType');
const filterGender = document.getElementById('filterGender');
const resetFiltersBtn = document.getElementById('resetFilters');
const cartBtn = document.getElementById('cartBtn');
const cartOverlay = document.getElementById('cartOverlay');
const cartSidebar = document.getElementById('cartSidebar');
const cartClose = document.getElementById('cartClose');
const cartItems = document.getElementById('cartItems');
const cartEmpty = document.getElementById('cartEmpty');
const cartTotal = document.getElementById('cartTotal');
const cartBadge = document.getElementById('cartBadge');
const checkoutBtn = document.getElementById('checkoutBtn');
const notification = document.getElementById('notification');
const backToTopBtn = document.getElementById('backToTop');

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', init);

async function init() {
  setupEventListeners();
  updateCartUI(); // Update UI with persisted cart
  await fetchInventory();
}

const header = document.getElementById('header');

function setupEventListeners() {
  // Search
  searchInput.addEventListener('input', debounce(handleSearch, 300));

  // Filters
  filterBrand.addEventListener('change', handleFilterChange);
  filterType.addEventListener('change', handleFilterChange);
  filterGender.addEventListener('change', handleFilterChange);
  resetFiltersBtn.addEventListener('click', handleResetFilters);

  // Cart
  cartBtn.addEventListener('click', openCart);
  cartOverlay.addEventListener('click', closeCart);
  cartClose.addEventListener('click', closeCart);
  checkoutBtn.addEventListener('click', handleCheckout);

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCart();
  });

  // Scroll effects
  window.addEventListener('scroll', () => {
    // Header effect
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Back to top visibility
    if (window.scrollY > 500) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ============================================
// FETCH INVENTORY - Conexión con Google Apps Script (JSON)
// ============================================

async function fetchInventory() {
  if (API_URL === "TU_URL_DEL_WEBAPP_JSON_AQUI" || !API_URL) {
    showNotification('⚠️ Configura la API_URL en js/app.js', 'error');
    hideLoading();
    renderEmptyState();
    return;
  }

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonData = await response.json();

    // Verificar estructura del JSON y normalizar a array de objetos
    let products = [];
    if (Array.isArray(jsonData)) {
      if (jsonData.length > 0 && Array.isArray(jsonData[0])) {
        // Es un array de arrays (resultado directo de getValues() en Apps Script)
        const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
        products = jsonData.slice(1).map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });
      } else {
        // Ya es un array de objetos
        products = jsonData;
      }
    } else if (jsonData.data && Array.isArray(jsonData.data)) {
      products = jsonData.data;
    } else if (jsonData.products && Array.isArray(jsonData.products)) {
      products = jsonData.products;
    } else {
      throw new Error('Formato JSON no reconocido. Se esperaba un array o un objeto con propiedad "data".');
    }

    if (products.length === 0) {
      console.warn('El inventario está vacío.');
      allProducts = [];
      filteredProducts = [];
      renderProducts([]);
      hideLoading();
      showNotification('ℹ️ El catálogo está vacío actualmente.', 'info');
      return;
    }

    // Mapear propiedades del JSON según los encabezados comunes
    allProducts = products.map(row => ({
      sku: row.sku || row.SKU || row.codigo || row.cod || row.id || '',
      name: row.nombre || row.Name || row.nombre_producto || row.producto || row.name || '',
      brand: row.marca || row.brand || row.Marca || row.marca_producto || '',
      type: row.tipo || row.type || row.Tipo || row.tipo_producto || row.tipo_de_producto || '',
      gender: row.genero || row.gender || row.Genero || row.sexo || '',
      price: parseFloat(String(row.precio_de_venta || row.precio_venta || row.precio || row.price || row.Precio || 0).replace(/[^\d.,]/g, '').replace(',', '.')),
      description: row.descripcion || row.descripción || row.description || row.Descripcion || '',
      stock: parseInt(row.stock_actual_auto || row.stock || row.Stock || 0),
      url_imagen: row.url_imagen || row.imagen || row.image || row.Imagen || '',
      category: row.categoría || row.categoria || row.category || ''
    })).filter(p => p.name && (p.sku || p.name)); // Filtrado menos estricto para depuración

    filteredProducts = [...allProducts];

    populateFilters();
    renderProducts(filteredProducts);
    hideLoading();
    showNotification('✨ Catálogo cargado correctamente', 'success');

  } catch (error) {
    console.error('Error fetching inventory:', error);
    showNotification('Error al cargar el catálogo. Verifica la URL del endpoint JSON.', 'error');
    hideLoading();
    renderEmptyState();
  }
}

// ============================================
// RENDER PRODUCTS - Generación de tarjetas
// ============================================

function renderProducts(products) {
  if (products.length === 0) {
    productsGrid.innerHTML = '';
    renderEmptyState();
    return;
  }

  const fragment = document.createDocumentFragment();
  products.forEach((product, index) => {
    const card = document.createRange().createContextualFragment(createProductCard(product, index));
    fragment.appendChild(card);
  });
  productsGrid.innerHTML = '';
  productsGrid.appendChild(fragment);

  setupLazyLoading();
  
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sku = e.target.dataset.sku;
      addToCart(sku);
    });
  });
}

function setupLazyLoading() {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '50px' });

  document.querySelectorAll('.product-image').forEach(img => {
    img.addEventListener('load', () => img.classList.add('loaded'));
    img.addEventListener('error', () => {
      img.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22><rect fill=%22%23f5f5f5%22 width=%22400%22 height=%22400%22/><text x=%22200%22 y=%22200%22 text-anchor=%22middle%22 fill=%22%23ccc%22 font-size=%2240%22>🌸</text></svg>';
      img.classList.add('loaded');
    });
    imageObserver.observe(img);
  });
}

function createProductCard(product, index) {
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const isOutOfStock = product.stock === 0;
  const priceFormatted = formatPrice(product.price);

  const imageUrl = formatDriveUrl(product.url_imagen);

  return `
    <article class="product-card" style="animation-delay: ${index * 0.05}s">
      <div class="product-image-container">
        ${isOutOfStock ? '<span class="product-badge">Agotado</span>' : ''}
        <img 
          class="product-image" 
          src="${imageUrl}" 
          alt="${product.name}"
          loading="lazy"
        >
      </div>
      <div class="product-info">
        <p class="product-brand">${product.brand}</p>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-meta">
          <span class="product-type">${product.type}</span>
          <span class="product-gender">${product.gender}</span>
        </div>
        <p class="product-price">${priceFormatted}</p>
        ${!isOutOfStock ?
      `<p class="product-stock ${isLowStock ? 'low' : ''}">${isLowStock ? `Solo quedan ${product.stock} unidades` : '✓ Disponible'}</p>` :
      `<p class="product-stock low">Sin stock disponible</p>`
    }
        <button 
          class="add-to-cart-btn" 
          data-sku="${product.sku}"
          ${isOutOfStock ? 'disabled' : ''}
        >
          ${isOutOfStock ? 'Agotado' : 'Agregar al Carrito'}
        </button>
      </div>
    </article>
  `;
}

function renderEmptyState() {
  productsGrid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3 class="empty-title">No se encontraron perfumes</h3>
      <p class="empty-text">Intenta ajustar los filtros o la búsqueda</p>
    </div>
  `;
}

// ============================================
// FILTER SYSTEM - Filtrado en tiempo real
// ============================================

function populateFilters() {
  // Get unique values
  const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort();
  const types = [...new Set(allProducts.map(p => p.type).filter(Boolean))].sort();
  const genders = [...new Set(allProducts.map(p => p.gender).filter(Boolean))].sort();

  // Populate brand filter
  filterBrand.innerHTML = '<option value="">Todas las marcas</option>' +
    brands.map(brand => `<option value="${brand}">${brand}</option>`).join('');

  // Populate type filter
  filterType.innerHTML = '<option value="">Todos los tipos</option>' +
    types.map(type => `<option value="${type}">${type}</option>`).join('');

  // Populate gender filter
  filterGender.innerHTML = '<option value="">Todos los géneros</option>' +
    genders.map(gender => `<option value="${gender}">${gender}</option>`).join('');
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  applyFilters(query);
}

function handleFilterChange() {
  const query = searchInput.value.toLowerCase().trim();
  applyFilters(query);
}

function handleResetFilters() {
  searchInput.value = '';
  filterBrand.value = '';
  filterType.value = '';
  filterGender.value = '';
  filteredProducts = [...allProducts];
  renderProducts(filteredProducts);
}

function applyFilters(searchQuery = '') {
  const brand = filterBrand.value;
  const type = filterType.value;
  const gender = filterGender.value;

  filteredProducts = allProducts.filter(product => {
    // Search filter
    if (searchQuery) {
      const searchFields = [
        product.name,
        product.brand,
        product.description,
        product.type,
        product.gender
      ].join(' ').toLowerCase();

      if (!searchFields.includes(searchQuery)) {
        return false;
      }
    }

    // Brand filter
    if (brand && product.brand !== brand) return false;

    // Type filter
    if (type && product.type !== type) return false;

    // Gender filter
    if (gender && product.gender !== gender) return false;

    return true;
  });

  renderProducts(filteredProducts);
}

// ============================================
// CART LOGIC - Sistema de carrito
// ============================================

function addToCart(sku) {
  const product = allProducts.find(p => p.sku === sku);
  if (!product) return;

  if (product.stock === 0) {
    showNotification('Este producto está agotado', 'error');
    return;
  }

  const existingItem = cart.find(item => item.sku === sku);

  if (existingItem) {
    if (existingItem.quantity >= product.stock) {
      showNotification('Stock máximo alcanzado', 'error');
      return;
    }
    existingItem.quantity++;
  } else {
    cart.push({
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      price: product.price,
      url_imagen: product.url_imagen,
      quantity: 1,
      stock: product.stock
    });
  }

  updateCartUI();
  saveCart();
  showNotification(`✨ ${product.name} agregado`, 'success');

  // Visual feedback on button
  const btn = document.querySelector(`.add-to-cart-btn[data-sku="${sku}"]`);
  if (btn) {
    btn.classList.add('added');
    btn.textContent = '✓ Agregado';
    setTimeout(() => {
      btn.classList.remove('added');
      btn.textContent = 'Agregar al Carrito';
    }, 1500);
  }
}

function removeFromCart(sku) {
  cart = cart.filter(item => item.sku !== sku);
  updateCartUI();
  saveCart();
  showNotification('Producto eliminado', 'success');
}

function updateQuantity(sku, delta) {
  const item = cart.find(i => i.sku === sku);
  if (!item) return;

  const product = allProducts.find(p => p.sku === sku);
  const newQuantity = item.quantity + delta;

  if (newQuantity <= 0) {
    removeFromCart(sku);
    return;
  }

  if (newQuantity > product.stock) {
    showNotification('Stock máximo alcanzado', 'error');
    return;
  }

  item.quantity = newQuantity;
  updateCartUI();
  saveCart();
}

function saveCart() {
  localStorage.setItem('pg_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartBadge.textContent = totalItems;
  cartBadge.classList.toggle('visible', totalItems > 0);

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Tu carrito está vacío</p>
      </div>
    `;
    checkoutBtn.disabled = true;
  } else {
    const fragment = document.createDocumentFragment();
    cart.forEach(item => {
      const div = document.createRange().createContextualFragment(createCartItem(item));
      fragment.appendChild(div);
    });
    cartItems.innerHTML = '';
    cartItems.appendChild(fragment);
    checkoutBtn.disabled = false;

    document.querySelectorAll('.quantity-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sku = e.target.dataset.sku;
        const delta = parseInt(e.target.dataset.delta);
        updateQuantity(sku, delta);
      });
    });

    document.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sku = e.target.closest('.cart-item-remove').dataset.sku;
        removeFromCart(sku);
      });
    });
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  cartTotal.textContent = formatPrice(total);
}

function createCartItem(item) {
  const imageUrl = formatDriveUrl(item.url_imagen);

  return `
    <div class="cart-item">
      <img class="cart-item-image" src="${imageUrl}" alt="${item.name}">
      <div class="cart-item-details">
        <h4 class="cart-item-name">${item.name}</h4>
        <p class="cart-item-brand">${item.brand}</p>
        <div class="cart-item-controls">
          <button class="quantity-btn" data-sku="${item.sku}" data-delta="-1">−</button>
          <span class="quantity-value">${item.quantity}</span>
          <button class="quantity-btn" data-sku="${item.sku}" data-delta="1">+</button>
        </div>
        <p class="cart-item-price">${formatPrice(item.price * item.quantity)}</p>
      </div>
      <button class="cart-item-remove" data-sku="${item.sku}" aria-label="Eliminar">🗑️</button>
    </div>
  `;
}

// ============================================
// CART SIDEBAR - Gestión visual
// ============================================

function openCart() {
  cartOverlay.classList.add('open');
  cartSidebar.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartOverlay.classList.remove('open');
  cartSidebar.classList.remove('open');
  document.body.style.overflow = '';
}

// ============================================
// WHATSAPP CHECKOUT - Generación de mensaje
// ============================================

function handleCheckout() {
  if (cart.length === 0) {
    showNotification('El carrito está vacío', 'error');
    return;
  }

  if (WHATSAPP_PHONE === "TU_NUMERO_DE_WHATSAPP_AQUI" || !WHATSAPP_PHONE) {
    showNotification('⚠️ Configura WHATSAPP_PHONE en js/app.js', 'error');
    return;
  }

  const message = generateWhatsAppMessage();
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
}

function generateWhatsAppMessage() {
  let message = `¡Hola! 👋 Me encantaron estos perfumes de la tienda y quiero pedirlos:\n\n`;

  cart.forEach((item, index) => {
    message += `• ${item.name} (${item.brand}) - ${item.quantity} unidad${item.quantity > 1 ? 'es' : ''}\n`;
  });

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  message += `\n💰 Total: ${formatPrice(total)}\n\n`;
  message += `¿Me podrías comentar cómo coordinamos el pago y el envío? ¡Gracias! ✨`;

  return message;
}

// ============================================
// UTILIDADES
// ============================================

function formatDriveUrl(url) {
  if (!url) return '';
  if (imageUrlCache.has(url)) return imageUrlCache.get(url);
  
  let cachedUrl;
  if (url.includes('drive.google.com') || url.includes('doc.google.com')) {
    const match = url.match(/[?&]id=([^&]+)|\/d\/([^/]+)|\/file\/d\/([^/]+)/);
    if (match) {
      const fileId = match[1] || match[2] || match[3];
      cachedUrl = `https://drive.google.com/thumbnail?id=${fileId}&w=400&authuser=0`;
    }
  }
  cachedUrl = cachedUrl || url;
  imageUrlCache.set(url, cachedUrl);
  return cachedUrl;
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0
  }).format(price);
}

const debounce = (func, wait) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };
};

function showNotification(message, type = 'info') {
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  notification.querySelector('.notification-icon').textContent = icon;
  notification.querySelector('.notification-message').textContent = message;
  notification.className = `notification ${type} show`;

  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

function hideLoading() {
  isLoading = false;
  loadingOverlay.classList.add('hidden');
}

// ============================================
// EXPORT (para testing si es necesario)
// ============================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchInventory,
    renderProducts,
    filterSystem: applyFilters,
    cartLogic: { addToCart, removeFromCart, updateQuantity },
    whatsappCheckout: handleCheckout
  };
}