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

// ── WALLET CONFIG
const WALLET = '0x25E6997CD1037E03662996E63875C99704f8F38D';
let allAssets = [];
let currentChain = 'all';
let USD_TO_COP = 4200;

const chainNames = {
  eth: { label: 'Ethereum', key: 'ethereum', icon: '⟠', color: '#627EEA', id: 1 },
  arb: { label: 'Arbitrum', key: 'arbitrum', icon: '🔵', color: '#28A0F0', id: 42161 },
  arbitrum: { label: 'Arbitrum', key: 'arbitrum', icon: '🔵', color: '#28A0F0', id: 42161 },
  bsc: { label: 'BNB Chain', key: 'bsc', icon: '🟡', color: '#F3BA2F', id: 56 },
  matic: { label: 'Polygon', key: 'polygon', icon: '🟣', color: '#8247E5', id: 137 },
  polygon: { label: 'Polygon', key: 'polygon', icon: '🟣', color: '#8247E5', id: 137 },
  op: { label: 'Optimism', key: 'optimism', icon: '🔴', color: '#FF0420', id: 10 },
  base: { label: 'Base', key: 'base', icon: '🔷', color: '#0052FF', id: 8453 },
};

// Tokens conocidos en Arbitrum con sus contratos
const KNOWN_TOKENS = {
  arbitrum: [
    { symbol: 'ETH', name: 'Ethereum', contract: 'native', decimals: 18, coingeckoId: 'ethereum' },
    { symbol: 'USDC', name: 'USD Coin', contract: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6, coingeckoId: 'usd-coin' },
    { symbol: 'USDC.e', name: 'Bridged USDC', contract: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', decimals: 6, coingeckoId: 'usd-coin' },
    { symbol: 'USDT', name: 'Tether', contract: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6, coingeckoId: 'tether' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', contract: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', decimals: 8, coingeckoId: 'wrapped-bitcoin' },
    { symbol: 'ARB', name: 'Arbitrum', contract: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18, coingeckoId: 'arbitrum' },
    { symbol: 'WETH', name: 'Wrapped Ether', contract: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18, coingeckoId: 'weth' },
    { symbol: 'DAI', name: 'Dai', contract: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18, coingeckoId: 'dai' },
    { symbol: 'LINK', name: 'Chainlink', contract: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', decimals: 18, coingeckoId: 'chainlink' },
    { symbol: 'UNI', name: 'Uniswap', contract: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0', decimals: 18, coingeckoId: 'uniswap' },
    { symbol: 'GMX', name: 'GMX', contract: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a', decimals: 18, coingeckoId: 'gmx' },
    { symbol: 'PENDLE', name: 'Pendle', contract: '0x0c880f6761F1af8d9Aa9C466984b80DAb9a8c9e8', decimals: 18, coingeckoId: 'pendle' },
    { symbol: 'RDNT', name: 'Radiant', contract: '0x3082CC23568eA640225c2467653dB90e9250AaA0', decimals: 18, coingeckoId: 'radiant-capital' },
    { symbol: 'MAGIC', name: 'Magic', contract: '0x539bdE0d7Dbd336b79148AA742883198BBF60342', decimals: 18, coingeckoId: 'magic' },
    { symbol: 'GNS', name: 'Gains Network', contract: '0x18c11FD286C5EC11c3b683Caa813B77f5163A122', decimals: 18, coingeckoId: 'gains-network' },
  ]
};

// Obtener tasa USD/COP
async function fetchExchangeRate() {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await res.json();
    if (data.rates?.COP) {
      USD_TO_COP = data.rates.COP;
      document.getElementById('exchangeRate').textContent = `1 USD = ${formatCOP(USD_TO_COP)}`;
    }
  } catch(e) {
    document.getElementById('exchangeRate').textContent = `1 USD ≈ ${formatCOP(USD_TO_COP)}`;
  }
}

// Obtener precios de CoinGecko
async function fetchPrices() {
  const ids = [...new Set(KNOWN_TOKENS.arbitrum.map(t => t.coingeckoId))].join(',');
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
    if (!res.ok) throw new Error('CoinGecko rate limit');
    return await res.json();
  } catch(e) {
    console.log('CoinGecko falló, usando precios de respaldo');
    return {
      'ethereum': { usd: 2500 },
      'usd-coin': { usd: 1 },
      'tether': { usd: 1 },
      'wrapped-bitcoin': { usd: 95000 },
      'arbitrum': { usd: 0.35 },
      'weth': { usd: 2500 },
      'dai': { usd: 1 },
      'chainlink': { usd: 14 },
      'uniswap': { usd: 6 },
      'gmx': { usd: 20 },
      'pendle': { usd: 4 },
      'radiant-capital': { usd: 0.02 },
      'magic': { usd: 0.3 },
      'gains-network': { usd: 2 },
    };
  }
}

// Leer balance ETH nativo
async function getEthBalance(rpcUrl) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [WALLET, 'latest'],
      id: 1
    })
  });
  const data = await res.json();
  return parseInt(data.result, 16) / 1e18;
}

// Leer balance de token ERC20
async function getTokenBalance(rpcUrl, tokenContract, decimals) {
  // balanceOf(address) = 0x70a08231
  const data = '0x70a08231000000000000000000000000' + WALLET.slice(2).toLowerCase();
  
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [{ to: tokenContract, data: data }, 'latest'],
      id: 1
    })
  });
  const result = await res.json();
  if (result.result && result.result !== '0x') {
    return parseInt(result.result, 16) / Math.pow(10, decimals);
  }
  return 0;
}

// Función principal para obtener activos
async function fetchAssets() {
  const tbody = document.getElementById('assetsBody');
  tbody.innerHTML = `
    <tr class="loading-row">
      <td colspan="5">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <span>Leyendo blockchain de Arbitrum...</span>
        </div>
      </td>
    </tr>
  `;
  
  document.getElementById('cryptoTotalUSD').innerHTML = '<span class="shimmer">Cargando...</span>';
  document.getElementById('cryptoTotalCOP').innerHTML = '<span class="shimmer">Cargando...</span>';
  document.getElementById('totalManejo').innerHTML = '<span class="shimmer">Calculando...</span>';
  
  try {
    // RPCs públicos de Arbitrum
    const rpcUrls = [
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum.llamarpc.com',
      'https://1rpc.io/arb'
    ];
    
    let rpcUrl = rpcUrls[0];
    
    // Probar conexión
    for (const url of rpcUrls) {
      try {
        const test = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
        });
        if (test.ok) {
          rpcUrl = url;
          break;
        }
      } catch(e) { continue; }
    }
    
    console.log('Usando RPC:', rpcUrl);
    
    // Obtener precios primero
    const prices = await fetchPrices();
    
    // Leer balances en paralelo
    const balancePromises = KNOWN_TOKENS.arbitrum.map(async (token) => {
      try {
        let balance;
        if (token.contract === 'native') {
          balance = await getEthBalance(rpcUrl);
        } else {
          balance = await getTokenBalance(rpcUrl, token.contract, token.decimals);
        }
        
        const priceData = prices[token.coingeckoId] || {};
        const price = priceData.usd || 0;
        const change24h = priceData.usd_24h_change || 0;
        
        return {
          symbol: token.symbol,
          name: token.name,
          chain: 'arb',
          amount: balance,
          price: price,
          price_24h_change: change24h / 100,
          logo_url: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/${token.contract}/logo.png`
        };
      } catch(e) {
        console.log(`Error leyendo ${token.symbol}:`, e);
        return null;
      }
    });
    
    const results = await Promise.all(balancePromises);
    allAssets = results.filter(t => t && t.amount > 0.0001);
    
    if (allAssets.length === 0) {
      // Si no hay tokens, mostrar mensaje pero con el ETH aunque sea 0
      throw new Error('No se encontraron activos con balance');
    }
    
    // Calcular totales
    const totalUSD = allAssets.reduce((s, t) => s + (t.amount * (t.price || 0)), 0);
    const totalCryptoCOP = totalUSD * USD_TO_COP;
    const prestamosVigentes = 36670233;
    const totalBajoGestion = totalCryptoCOP + prestamosVigentes;
    
    // Actualizar UI
    animateValue('cryptoTotalUSD', totalUSD, true);
    animateValue('cryptoTotalCOP', totalCryptoCOP, false);
    animateValue('totalManejo', totalBajoGestion, false, true);
    
    updateChainDistribution(allAssets);
    renderAssets(allAssets);
    
    const now = new Date();
    document.getElementById('lastUpdate').textContent = 
      `Última actualización: ${now.toLocaleTimeString('es-CO')}`;
    
  } catch(e) {
    console.error('Error:', e);
    
    // Mostrar datos de demostración si falla
    showDemoData();
  }
}

// Datos de demostración si todo falla
function showDemoData() {
  const tbody = document.getElementById('assetsBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="error-cell">
        <div class="error-message">
          <span class="error-icon">⏳</span>
          <p>Cargando datos de la blockchain...</p>
          <p style="font-size:12px;margin-top:8px;opacity:0.7;">Si persiste, verifica tu conexión</p>
          <button onclick="fetchAssets()" class="retry-btn">🔄 Reintentar</button>
          <a href="https://arbiscan.io/address/${WALLET}" target="_blank" class="debank-fallback" style="margin-top:12px;">
            Ver en Arbiscan →
          </a>
        </div>
      </td>
    </tr>
  `;
  
  document.getElementById('cryptoTotalUSD').textContent = '—';
  document.getElementById('cryptoTotalCOP').textContent = '—';
  document.getElementById('totalManejo').textContent = '$36.7M+';
  
  const distPanel = document.querySelector('.chain-distribution-panel');
  if (distPanel) distPanel.style.display = 'none';
}

// Animación de números
function animateValue(elementId, finalValue, isUSD = false, isMillions = false) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
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
      el.textContent = '$' + (current / 1e6).toFixed(1) + 'M';
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
    const chainKey = chainNames[token.chain]?.key || token.chain;
    distribution[chainKey] = (distribution[chainKey] || 0) + value;
    totalValue += value;
  });
  
  const container = document.getElementById('chainDistribution');
  if (!container || totalValue === 0) return;
  
  container.style.display = 'grid';
  
  const sortedChains = Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  container.innerHTML = sortedChains.map(([chain, value]) => {
    const percentage = ((value / totalValue) * 100).toFixed(1);
    const chainInfo = chainNames[chain] || { label: chain, color: '#C9A84C' };
    
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
  
  const sorted = filtered.sort((a, b) => (b.amount * (b.price || 0)) - (a.amount * (a.price || 0)));
  
  tbody.innerHTML = sorted.map((token, index) => {
    const valueUSD = token.amount * (token.price || 0);
    const valueCOP = valueUSD * USD_TO_COP;
    const chainInfo = chainNames[token.chain] || { label: token.chain, icon: '🔗', color: '#888' };
    const priceChange = token.price_24h_change || 0;
    const changeClass = priceChange >= 0 ? 'positive' : 'negative';
    const changeIcon = priceChange >= 0 ? '↑' : '↓';
    
    // Logos por símbolo
    const logoMap = {
      'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      'USDC': 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
      'USDC.e': 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
      'USDT': 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
      'WBTC': 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
      'ARB': 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
      'WETH': 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
      'DAI': 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
      'LINK': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
      'UNI': 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
      'GMX': 'https://assets.coingecko.com/coins/images/18323/small/arbit.png',
      'PENDLE': 'https://assets.coingecko.com/coins/images/15069/small/Pendle_Logo_Normal-03.png',
      'RDNT': 'https://assets.coingecko.com/coins/images/26536/small/Radiant-Logo-200x200.png',
      'MAGIC': 'https://assets.coingecko.com/coins/images/18623/small/magic.png',
      'GNS': 'https://assets.coingecko.com/coins/images/19737/small/logo.png',
    };
    
    const logoUrl = logoMap[token.symbol] || '';
    
    return `
      <tr class="asset-row" style="animation-delay: ${index * 50}ms;">
        <td class="token-cell">
          <div class="token-info">
            ${logoUrl 
              ? `<img src="${logoUrl}" alt="${token.symbol}" class="token-logo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
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

function formatTokenAmount(amount) {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(2) + 'M';
  } else if (amount >= 1000) {
    return (amount / 1000).toFixed(2) + 'K';
  } else if (amount >= 1) {
    return amount.toFixed(4);
  } else if (amount >= 0.0001) {
    return amount.toFixed(6);
  } else {
    return amount.toExponential(2);
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
  if (btn) btn.classList.add('spinning');
  fetchAssets().finally(() => {
    setTimeout(() => {
      if (btn) btn.classList.remove('spinning');
    }, 500);
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