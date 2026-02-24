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

  // ── WALLET / DEBANK
  const WALLET = '0x25E6997CD1037E03662996E63875C99704f8F38D';
  let allAssets = [];
  let currentChain = 'all';

  const chainNames = {
    eth: { label: 'Ethereum', key: 'ethereum' },
    arb: { label: 'Arbitrum', key: 'arbitrum' },
    bsc: { label: 'BNB Chain', key: 'bsc' },
    matic: { label: 'Polygon', key: 'polygon' },
    op:  { label: 'Optimism', key: 'optimism' },
    base: { label: 'Base', key: 'base' },
  };

  async function fetchAssets() {
    const tbody = document.getElementById('assetsBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:32px;">⟳ Cargando activos...</td></tr>';
    try {
      const res = await fetch(`https://api.debank.com/user/all_token_list?id=${WALLET.toLowerCase()}&is_all=false`);
      const data = await res.json();
      if (data.data) {
        allAssets = data.data.filter(t => t.amount > 0);
        let totalUSD = allAssets.reduce((s, t) => s + (t.amount * (t.price || 0)), 0);
        document.getElementById('cryptoTotal').textContent = '$' + totalUSD.toLocaleString('en-US', {maximumFractionDigits:0});
        const totalCOP = 36670233 + totalUSD * 4200;
        document.getElementById('totalManejo').textContent = '$' + Math.round(totalCOP/1e6).toLocaleString('es-CO') + 'M COP';
        renderAssets(allAssets);
      } else { throw new Error(); }
    } catch(e) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:32px;">No se pudo cargar. <a href="https://debank.com/profile/' + WALLET + '" target="_blank" style="color:var(--gold);">Ver en DeBank →</a></td></tr>';
      document.getElementById('cryptoTotal').textContent = 'Ver DeBank';
    }
  }

  function renderAssets(assets) {
    const tbody = document.getElementById('assetsBody');
    const filtered = currentChain === 'all' ? assets : assets.filter(a => chainNames[a.chain]?.key === currentChain);
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:32px;">Sin activos en esta red.</td></tr>';
      return;
    }
    tbody.innerHTML = filtered.sort((a,b) => (b.amount*(b.price||0)) - (a.amount*(a.price||0))).map(t => {
      const usd = (t.amount * (t.price || 0)).toFixed(2);
      const chainLabel = chainNames[t.chain]?.label || t.chain;
      return `<tr>
        <td style="font-weight:500;">${t.symbol}</td>
        <td style="color:var(--text-muted);font-size:13px;">${chainLabel}</td>
        <td>${parseFloat(t.amount.toFixed(6)).toLocaleString()}</td>
        <td style="color:var(--gold);">$${parseFloat(usd).toLocaleString()}</td>
      </tr>`;
    }).join('');
  }

  function filterChain(chain, btn) {
    currentChain = chain;
    document.querySelectorAll('.chain-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderAssets(allAssets);
  }

  function refreshAssets() { fetchAssets(); }

  function copyAddress() {
    navigator.clipboard.writeText(WALLET).then(() => {
      const el = document.querySelector('.wallet-address');
      el.innerHTML = '✓ Copiado';
      setTimeout(() => { el.innerHTML = '0x25E6...8F38D <span>⧉</span>'; }, 2000);
    });
  }

  // ── MODAL
  function closeModal() { document.getElementById('modalConstruccion').classList.remove('open'); }

  // ── INIT
  document.addEventListener('DOMContentLoaded', () => {
    fetchAssets();
  });