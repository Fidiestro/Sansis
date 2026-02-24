// ── NAV MOBILE
function toggleMenu() {
  document.getElementById('navMobile').classList.toggle('open');
}

// ── FAQ
function toggleFaq(btn) {
  const item = btn.parentElement;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ── CALCULADORA
function formatCOP(n) {
  return '$' + Math.round(n).toLocaleString('es-CO');
}

function calcular() {
  const monto = parseFloat(document.getElementById('calcMonto').value) || 0;
  const meses = parseInt(document.getElementById('calcMeses').value) || 0;
  const tasa = parseFloat(document.getElementById('calcTipo').value) || 0;
  const ganancia = monto * tasa * (meses / 12);
  const total = monto + ganancia;
  document.getElementById('calcGanancias').textContent = formatCOP(ganancia);
  document.getElementById('calcTotal').textContent = 'Total a recibir: ' + formatCOP(total);
}

// ── WALLET / DEBANK - VERSIÓN MEJORADA
const WALLET = '0x25E6997CD1037E03662996E63875C99704f8F38D';
let allAssets = [];
let currentChain = 'all';
let USD_TO_COP = 4200; // Tasa por defecto

const chainNames = {
  eth: { label: 'Ethereum', key: 'ethereum', icon: '⟠', color: '#627EEA' },
  arb: { label: 'Arbitrum', key: 'arbitrum', icon: '🔵', color: '#28A0F0' },
  bsc: { label: 'BNB Chain', key: 'bsc', icon: '🟡', color: '#F3BA2F' },
  matic: { label: 'Polygon', key: 'polygon', icon: '🟣', color: '#8247E5' },
  op: { label: 'Optimism', key: 'optimism', icon: '🔴', color: '#FF0420' },
  base: { label: 'Base', key: 'base', icon: '🔷', color: '#0052FF' },
  avax: { label: 'Avalanche', key: 'avalanche', icon: '🔺', color: '#E84142' },
  ftm: { label: 'Fantom', key: 'fantom', icon: '👻', color: '#1969FF' },
};

// Obtener tasa USD/COP actualizada
async function fetchExchangeRate() {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await res.json();
    if (data.rates && data.rates.COP) {
      USD_TO_COP = data.rates.COP;
      document.getElementById('exchangeRate').textContent = `1 USD = ${formatCOP(USD_TO_COP)}`;
    }
  } catch(e) {
    console.log('Usando tasa por defecto USD/COP');
    document.getElementById('exchangeRate').textContent = `1 USD ≈ ${formatCOP(USD_TO_COP)}`;
  }
}

// Función de respaldo usando múltiples proxies
async function fetchBackupData() {
  const proxies = [
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
  ];
  
  const debankUrl = `https://api.debank.com/user/all_token_list?id=${WALLET.toLowerCase()}&is_all=false`;
  
  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy + encodeURIComponent(debankUrl), {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.data) {
          return data.data.filter(t => t.amount > 0);
        }
      }
    } catch(e) {
      console.log(`Proxy ${proxy} falló, intentando siguiente...`);
    }
  }
  
  // Si todos los proxies fallan, usar datos estáticos
  // ACTUALIZA ESTOS DATOS PERIÓDICAMENTE
  console.log('Usando datos estáticos de respaldo');
  return getStaticAssets();
}

// Datos estáticos de respaldo - ACTUALIZAR MANUALMENTE
// Última actualización: Agregar fecha aquí
function getStaticAssets() {
  return [
    // Agrega aquí tus tokens actuales copiados de DeBank
    // Ejemplo de formato:
    // { symbol: 'ETH', name: 'Ethereum', chain: 'eth', amount: 0.5, price: 2500, logo_url: 'https://static.debank.com/image/eth_token/logo_url/eth/xxx.png' },
    // { symbol: 'USDC', name: 'USD Coin', chain: 'arb', amount: 1000, price: 1, logo_url: '...' },
  ];
}

async function fetchAssets() {
  const tbody = document.getElementById('assetsBody');
  const loadingHTML = `
    <tr class="loading-row">
      <td colspan="5">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <span>Conectando con blockchain...</span>
        </div>
      </td>
    </tr>
  `;
  tbody.innerHTML = loadingHTML;
  
  // Animación de los totales
  document.getElementById('cryptoTotalUSD').innerHTML = '<span class="shimmer">Cargando...</span>';
  document.getElementById('cryptoTotalCOP').innerHTML = '<span class="shimmer">Cargando...</span>';
  document.getElementById('totalManejo').innerHTML = '<span class="shimmer">Calculando...</span>';
  
  try {
    // Intentar con proxy CORS para DeBank
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const debankUrl = `https://api.debank.com/user/all_token_list?id=${WALLET.toLowerCase()}&is_all=false`;
    
    let data;
    let useBackup = false;
    
    try {
      const res = await fetch(proxyUrl + encodeURIComponent(debankUrl));
      if (!res.ok) throw new Error('Proxy failed');
      data = await res.json();
    } catch(proxyError) {
      console.log('Proxy falló, usando datos de respaldo...');
      useBackup = true;
    }
    
    // Si el proxy falla, usar datos estáticos de respaldo
    if (useBackup || !data?.data) {
      // Usar Moralis o datos de respaldo
      allAssets = await fetchBackupData();
      if (!allAssets || allAssets.length === 0) {
        throw new Error('No se pudieron obtener datos');
      }
    } else {
      allAssets = data.data.filter(t => t.amount > 0);
    }
    
    if (allAssets.length > 0) {
      
      // Calcular totales
      const totalUSD = allAssets.reduce((s, t) => s + (t.amount * (t.price || 0)), 0);
      const totalCryptoCOP = totalUSD * USD_TO_COP;
      const prestamosVigentes = 36670233; // COP
      const totalBajoGestion = totalCryptoCOP + prestamosVigentes;
      
      // Actualizar UI con animación
      animateValue('cryptoTotalUSD', totalUSD, true);
      animateValue('cryptoTotalCOP', totalCryptoCOP, false);
      animateValue('totalManejo', totalBajoGestion, false, true);
      
      // Calcular distribución por red
      updateChainDistribution(allAssets);
      
      // Renderizar tabla
      renderAssets(allAssets);
      
      // Mostrar timestamp
      const now = new Date();
      document.getElementById('lastUpdate').textContent = 
        `Última actualización: ${now.toLocaleTimeString('es-CO')}`;
        
    } else { 
      throw new Error('Sin datos'); 
    }
  } catch(e) {
    console.error('Error fetching assets:', e);
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="error-cell">
          <div class="error-message">
            <span class="error-icon">🔗</span>
            <p>Los datos en tiempo real requieren verificación directa</p>
            <p style="font-size:12px;margin-top:8px;opacity:0.7;">La API de DeBank tiene restricciones de acceso directo</p>
            <a href="https://debank.com/profile/${WALLET}" target="_blank" class="debank-fallback">
              🔍 Ver balance actual en DeBank →
            </a>
          </div>
        </td>
      </tr>
    `;
    document.getElementById('cryptoTotalUSD').textContent = '—';
    document.getElementById('cryptoTotalCOP').textContent = '—';
    document.getElementById('totalManejo').textContent = '$36.7M+';
    
    // Ocultar distribución si no hay datos
    const distPanel = document.querySelector('.chain-distribution-panel');
    if (distPanel) distPanel.style.display = 'none';
  }
}

// Animación de números
function animateValue(elementId, finalValue, isUSD = false, isMillions = false) {
  const el = document.getElementById(elementId);
  const duration = 1200;
  const steps = 30;
  const increment = finalValue / steps;
  let current = 0;
  let step = 0;
  
  const timer = setInterval(() => {
    step++;
    current += increment;
    
    if (step >= steps) {
      current = finalValue;
      clearInterval(timer);
    }
    
    if (isUSD) {
      el.textContent = '$' + Math.round(current).toLocaleString('en-US');
    } else if (isMillions) {
      el.textContent = '$' + (current / 1e6).toFixed(1).toLocaleString('es-CO') + 'M';
    } else {
      el.textContent = formatCOP(current);
    }
  }, duration / steps);
}

// Distribución por cadena
function updateChainDistribution(assets) {
  const distribution = {};
  let totalValue = 0;
  
  assets.forEach(token => {
    const value = token.amount * (token.price || 0);
    const chain = chainNames[token.chain]?.key || token.chain;
    distribution[chain] = (distribution[chain] || 0) + value;
    totalValue += value;
  });
  
  const container = document.getElementById('chainDistribution');
  if (!container) return;
  
  const sortedChains = Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  container.innerHTML = sortedChains.map(([chain, value]) => {
    const percentage = ((value / totalValue) * 100).toFixed(1);
    const chainInfo = Object.values(chainNames).find(c => c.key === chain) || { label: chain, color: '#C9A84C' };
    
    return `
      <div class="chain-bar-item">
        <div class="chain-bar-header">
          <span class="chain-bar-name">${chainInfo.label}</span>
          <span class="chain-bar-value">${percentage}%</span>
        </div>
        <div class="chain-bar-track">
          <div class="chain-bar-fill" style="width: ${percentage}%; background: ${chainInfo.color};"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderAssets(assets) {
  const tbody = document.getElementById('assetsBody');
  const filtered = currentChain === 'all' 
    ? assets 
    : assets.filter(a => chainNames[a.chain]?.key === currentChain);
  
  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-cell">
          <div class="empty-message">
            <span>📭</span>
            <p>Sin activos en esta red</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  // Ordenar por valor USD descendente
  const sorted = filtered.sort((a, b) => (b.amount * (b.price || 0)) - (a.amount * (a.price || 0)));
  
  tbody.innerHTML = sorted.map((token, index) => {
    const valueUSD = token.amount * (token.price || 0);
    const valueCOP = valueUSD * USD_TO_COP;
    const chainInfo = chainNames[token.chain] || { label: token.chain, icon: '🔗', color: '#888' };
    const priceChange = token.price_24h_change || 0;
    const changeClass = priceChange >= 0 ? 'positive' : 'negative';
    const changeIcon = priceChange >= 0 ? '↑' : '↓';
    
    return `
      <tr class="asset-row" style="animation-delay: ${index * 50}ms;">
        <td class="token-cell">
          <div class="token-info">
            ${token.logo_url 
              ? `<img src="${token.logo_url}" alt="${token.symbol}" class="token-logo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                 <div class="token-logo-fallback" style="display:none;">${token.symbol.charAt(0)}</div>`
              : `<div class="token-logo-fallback">${token.symbol.charAt(0)}</div>`
            }
            <div class="token-details">
              <span class="token-symbol">${token.symbol}</span>
              ${token.name ? `<span class="token-name">${token.name}</span>` : ''}
            </div>
          </div>
        </td>
        <td class="chain-cell">
          <span class="chain-badge" style="--chain-color: ${chainInfo.color};">
            ${chainInfo.icon} ${chainInfo.label}
          </span>
        </td>
        <td class="balance-cell">
          <span class="balance-amount">${formatTokenAmount(token.amount)}</span>
          ${token.price ? `
            <span class="token-price">
              @$${token.price < 0.01 ? token.price.toFixed(6) : token.price.toFixed(2)}
              ${priceChange !== 0 ? `<span class="price-change ${changeClass}">${changeIcon}${Math.abs(priceChange * 100).toFixed(1)}%</span>` : ''}
            </span>
          ` : ''}
        </td>
        <td class="value-usd-cell">
          <span class="value-usd">$${valueUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </td>
        <td class="value-cop-cell">
          <span class="value-cop">${formatCOP(valueCOP)}</span>
        </td>
      </tr>
    `;
  }).join('');
}

// Formatear cantidad de tokens
function formatTokenAmount(amount) {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(2) + 'M';
  } else if (amount >= 1000) {
    return (amount / 1000).toFixed(2) + 'K';
  } else if (amount >= 1) {
    return amount.toFixed(4);
  } else {
    return amount.toFixed(6);
  }
}

function filterChain(chain, btn) {
  currentChain = chain;
  document.querySelectorAll('.chain-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAssets(allAssets);
}

function refreshAssets() {
  const btn = document.querySelector('.refresh-btn');
  btn.classList.add('spinning');
  fetchAssets().finally(() => {
    setTimeout(() => btn.classList.remove('spinning'), 500);
  });
}

function copyAddress() {
  navigator.clipboard.writeText(WALLET).then(() => {
    const el = document.querySelector('.wallet-address');
    const original = el.innerHTML;
    el.innerHTML = '<span class="copy-success">✓ Copiado al portapapeles</span>';
    setTimeout(() => { el.innerHTML = original; }, 2000);
  });
}

// ── MODAL
function closeModal() { 
  document.getElementById('modalConstruccion').classList.remove('open'); 
}

// ── INIT
document.addEventListener('DOMContentLoaded', () => {
  fetchExchangeRate();
  fetchAssets();
});