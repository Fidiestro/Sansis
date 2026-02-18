function openModal() {
        document.getElementById('modal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeModal() {
        document.getElementById('modal').classList.remove('active');
        document.body.style.overflow = '';
    }
    function handleModalClick(e) {
        if (e.target === e.currentTarget) closeModal();
    }

    // Mobile Menu
    function openMobileMenu() {
        const menu = document.getElementById('mobileMenu');
        menu.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeMobileMenu() {
        const menu = document.getElementById('mobileMenu');
        menu.classList.remove('open');
        document.body.style.overflow = '';
    }

    // Calculator
    function calculateReturn() {
        const amount = parseFloat(document.getElementById('investAmount').value);
        const period = parseInt(document.getElementById('investPeriod').value);
        const annualRate = parseFloat(document.getElementById('investRate').value);
        if (!amount || !period || amount < 0 || period < 1) return;
        const monthlyRate = annualRate / 100 / 12;
        const totalAmount = amount * Math.pow(1 + monthlyRate, period);
        const earnings = totalAmount - amount;
        const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
        document.getElementById('totalEarnings').textContent = fmt.format(earnings);
        document.getElementById('totalAmount').textContent = fmt.format(totalAmount);
        document.getElementById('calculatorResult').classList.add('active');
    }

    document.getElementById('investAmount').addEventListener('input', calculateReturn);
    document.getElementById('investPeriod').addEventListener('input', calculateReturn);
    document.getElementById('investRate').addEventListener('change', calculateReturn);
    window.addEventListener('load', calculateReturn);

    // FAQ
    function toggleFAQ(el) {
        const item = el.parentElement;
        const isActive = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
        if (!isActive) item.classList.add('active');
    }

    // ================================================================
    // WALLET TRACKER — MULTI-CHAIN (estilo DeBank)
    // Estrategia: RPC públicas para native balance + CoinGecko para precios
    // ================================================================
    const WALLET = '0x25E6997CD1037E03662996E63875C99704f8F38D';

    // Chains config: rpc, nativeSymbol, nativeCoinId (CoinGecko), explorer
    // Chains config con múltiples RPCs de fallback por cadena
    // Si el primario falla, rpcCall() prueba el siguiente automáticamente
    const CHAINS = {
        eth: {
            name:'Ethereum', nativeSym:'ETH', coinId:'ethereum', explorer:'https://etherscan.io',
            panel:'panelEth', nativeEl:'ethNativeBal', totalEl:'ethChainTotal', listEl:'ethTokensList', tabEl:'tab-usd-eth',
            rpcs: [
                'https://eth.llamarpc.com',
                'https://endpoints.omniatech.io/v1/eth/mainnet/public',
                'https://ethereum.publicnode.com',
                'https://rpc.ankr.com/eth',
                'https://cloudflare-eth.com',
            ]
        },
        arb: {
            name:'Arbitrum', nativeSym:'ETH', coinId:'ethereum', explorer:'https://arbiscan.io',
            panel:'panelArb', nativeEl:'arbNativeBal', totalEl:'arbChainTotal', listEl:'arbTokensList', tabEl:'tab-usd-arb',
            rpcs: [
                'https://arb1.arbitrum.io/rpc',
                'https://endpoints.omniatech.io/v1/arbitrum/one/public',
                'https://arbitrum-one.publicnode.com',
                'https://rpc.ankr.com/arbitrum',
                'https://arbitrum.llamarpc.com',
            ]
        },
        bsc: {
            name:'BNB Chain', nativeSym:'BNB', coinId:'binancecoin', explorer:'https://bscscan.com',
            panel:'panelBsc', nativeEl:'bscNativeBal', totalEl:'bscChainTotal', listEl:'bscTokensList', tabEl:'tab-usd-bsc',
            rpcs: [
                'https://bsc-dataseed.binance.org/',
                'https://endpoints.omniatech.io/v1/bsc/mainnet/public',
                'https://bsc.publicnode.com',
                'https://rpc.ankr.com/bsc',
                'https://bsc-dataseed1.defibit.io',
            ]
        },
        matic: {
            name:'Polygon', nativeSym:'MATIC', coinId:'matic-network', explorer:'https://polygonscan.com',
            panel:'panelMatic', nativeEl:'maticNativeBal', totalEl:'maticChainTotal', listEl:'maticTokensList', tabEl:'tab-usd-matic',
            rpcs: [
                'https://polygon-rpc.com',
                'https://endpoints.omniatech.io/v1/matic/mainnet/public',
                'https://polygon.publicnode.com',
                'https://rpc.ankr.com/polygon',
                'https://polygon-bor-rpc.publicnode.com',
            ]
        },
        op: {
            name:'Optimism', nativeSym:'ETH', coinId:'ethereum', explorer:'https://optimistic.etherscan.io',
            panel:'panelOp', nativeEl:'opNativeBal', totalEl:'opChainTotal', listEl:'opTokensList', tabEl:'tab-usd-op',
            rpcs: [
                'https://mainnet.optimism.io',
                'https://endpoints.omniatech.io/v1/op/mainnet/public',
                'https://optimism.publicnode.com',
                'https://rpc.ankr.com/optimism',
                'https://optimism.llamarpc.com',
            ]
        },
        base: {
            name:'Base', nativeSym:'ETH', coinId:'ethereum', explorer:'https://basescan.org',
            panel:'panelBase', nativeEl:'baseNativeBal', totalEl:'baseChainTotal', listEl:'baseTokensList', tabEl:'tab-usd-base',
            rpcs: [
                'https://mainnet.base.org',
                'https://endpoints.omniatech.io/v1/base/mainnet/public',
                'https://base.publicnode.com',
                'https://rpc.ankr.com/base',
                'https://base.llamarpc.com',
            ]
        },
    };

    // Well-known ERC-20 tokens to check per chain (address, symbol, decimals, coinId)
    const TOKENS_PER_CHAIN = {
        eth: [
            { addr:'0xdAC17F958D2ee523a2206206994597C13D831ec7', sym:'USDT',  dec:6,  coinId:'tether',           name:'Tether USD' },
            { addr:'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', sym:'USDC',  dec:6,  coinId:'usd-coin',         name:'USD Coin' },
            { addr:'0x6B175474E89094C44Da98b954EedeAC495271d0F', sym:'DAI',   dec:18, coinId:'dai',              name:'Dai Stablecoin' },
            { addr:'0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', sym:'WBTC',  dec:8,  coinId:'wrapped-bitcoin',  name:'Wrapped Bitcoin' },
            { addr:'0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', sym:'UNI',   dec:18, coinId:'uniswap',          name:'Uniswap' },
            { addr:'0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', sym:'AAVE',  dec:18, coinId:'aave',             name:'Aave' },
            { addr:'0x514910771AF9Ca656af840dff83E8264EcF986CA', sym:'LINK',  dec:18, coinId:'chainlink',        name:'Chainlink' },
            { addr:'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', sym:'WETH',  dec:18, coinId:'ethereum',         name:'Wrapped Ether' },
        ],
        arb: [
            { addr:'0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', sym:'USDT',  dec:6,  coinId:'tether',           name:'Tether USD' },
            { addr:'0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', sym:'USDC.e',dec:6,  coinId:'usd-coin',         name:'Bridged USDC' },
            { addr:'0xaf88d065e77c8cC2239327C5EDb3A432268e5831', sym:'USDC',  dec:6,  coinId:'usd-coin',         name:'Native USDC' },
            { addr:'0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', sym:'DAI',   dec:18, coinId:'dai',              name:'Dai Stablecoin' },
            { addr:'0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', sym:'WBTC',  dec:8,  coinId:'wrapped-bitcoin',  name:'Wrapped Bitcoin' },
            { addr:'0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', sym:'WETH',  dec:18, coinId:'ethereum',         name:'Wrapped Ether' },
            { addr:'0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a', sym:'GMX',   dec:18, coinId:'gmx',              name:'GMX' },
        ],
        bsc: [
            { addr:'0x55d398326f99059fF775485246999027B3197955', sym:'USDT',  dec:18, coinId:'tether',           name:'Tether USD (BSC)' },
            { addr:'0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', sym:'USDC',  dec:18, coinId:'usd-coin',         name:'USD Coin (BSC)' },
            { addr:'0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', sym:'DAI',   dec:18, coinId:'dai',              name:'Dai (BSC)' },
            { addr:'0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', sym:'BTCB',  dec:18, coinId:'bitcoin-bep2',     name:'Bitcoin BEP-2' },
            { addr:'0x2170Ed0880ac9A755fd29B2688956BD959F933F8', sym:'ETH',   dec:18, coinId:'ethereum',         name:'Ethereum (BSC)' },
            { addr:'0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', sym:'WBNB',  dec:18, coinId:'wbnb',             name:'Wrapped BNB' },
            { addr:'0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', sym:'BUSD',  dec:18, coinId:'binance-usd',      name:'Binance USD' },
        ],
        matic: [
            { addr:'0xc2132D05D31c914a87C6611C10748AEb04B58e8F', sym:'USDT',  dec:6,  coinId:'tether',           name:'Tether USD' },
            { addr:'0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', sym:'USDC',  dec:6,  coinId:'usd-coin',         name:'USD Coin' },
            { addr:'0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', sym:'DAI',   dec:18, coinId:'dai',              name:'Dai Stablecoin' },
            { addr:'0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', sym:'WBTC',  dec:8,  coinId:'wrapped-bitcoin',  name:'Wrapped Bitcoin' },
            { addr:'0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', sym:'WETH',  dec:18, coinId:'ethereum',         name:'Wrapped Ether' },
            { addr:'0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', sym:'WMATIC',dec:18, coinId:'wmatic',           name:'Wrapped MATIC' },
        ],
        op: [
            { addr:'0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', sym:'USDT',  dec:6,  coinId:'tether',           name:'Tether USD' },
            { addr:'0x7F5c764cBc14f9669B88837ca1490cCa17c31607', sym:'USDC.e',dec:6,  coinId:'usd-coin',         name:'Bridged USDC' },
            { addr:'0x4200000000000000000000000000000000000006', sym:'WETH',  dec:18, coinId:'ethereum',         name:'Wrapped Ether' },
            { addr:'0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', sym:'DAI',   dec:18, coinId:'dai',              name:'Dai Stablecoin' },
            { addr:'0x4200000000000000000000000000000000000042', sym:'OP',    dec:18, coinId:'optimism',         name:'Optimism' },
        ],
        base: [
            { addr:'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', sym:'USDC',  dec:6,  coinId:'usd-coin',         name:'USD Coin' },
            { addr:'0x4200000000000000000000000000000000000006', sym:'WETH',  dec:18, coinId:'ethereum',         name:'Wrapped Ether' },
            { addr:'0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', sym:'DAI',   dec:18, coinId:'dai',              name:'Dai Stablecoin' },
            { addr:'0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', sym:'cbETH', dec:18, coinId:'coinbase-wrapped-staked-eth', name:'Coinbase Wrapped Staked ETH' },
        ],
    };

    // ERC-20 balanceOf ABI encoded call
    function encodeBalanceOf(addr) {
        const sig = '0x70a08231';
        const padded = addr.replace('0x','').padStart(64,'0');
        return sig + padded;
    }

    // rpcCall con fallback automático: prueba cada RPC en orden hasta que uno responda bien
    async function rpcCall(rpcUrls, method, params) {
        const urls = Array.isArray(rpcUrls) ? rpcUrls : [rpcUrls];
        let lastError;
        for (const url of urls) {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jsonrpc:'2.0', method, params, id:1 }),
                    signal: AbortSignal.timeout(7000)
                });
                const data = await res.json();
                if (data.result !== undefined && data.result !== null) return data.result;
                if (data.error) throw new Error(data.error.message || 'RPC error');
            } catch(e) {
                lastError = e;
                // Intenta el siguiente RPC
            }
        }
        throw lastError || new Error('Todos los RPCs fallaron');
    }

    async function getNativeBalance(rpcUrls, walletAddr) {
        const result = await rpcCall(rpcUrls, 'eth_getBalance', [walletAddr, 'latest']);
        if (!result || result === '0x') return 0;
        const val = parseInt(result, 16);
        return isNaN(val) ? 0 : val / 1e18;
    }

    async function getTokenBalance(rpcUrls, tokenAddr, walletAddr, decimals) {
        try {
            const data = encodeBalanceOf(walletAddr);
            const result = await rpcCall(rpcUrls, 'eth_call', [{ to: tokenAddr, data }, 'latest']);
            if (!result || result === '0x') return 0;
            const val = parseInt(result, 16);
            return isNaN(val) ? 0 : val / Math.pow(10, decimals);
        } catch(e) { return 0; }
    }

    async function fetchPrices(coinIds) {
        const ids = [...new Set(coinIds)].join(',');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
            return await res.json();
        } catch(e) {
            // fallback: try without 24hr_change
            try {
                const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`, { signal: AbortSignal.timeout(8000) });
                return await res.json();
            } catch(e2) { return {}; }
        }
    }

    const fmtUSD = v => {
        if (typeof v !== 'number' || isNaN(v)) return '$0.00';
        return '$' + v.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
    };
    const fmtToken = (v, sym) => {
        if (v >= 1000000) return (v/1000000).toFixed(2) + 'M ' + sym;
        if (v >= 1000) return (v/1000).toFixed(2) + 'K ' + sym;
        return v.toLocaleString('en-US', { minimumFractionDigits:0, maximumFractionDigits:4 }) + ' ' + sym;
    };

    function tokenRow(icon, name, symbol, balance, usdVal) {
        if (usdVal < 0.01) return ''; // hide dust
        return `
        <div class="token-list-row">
            <div class="tl-icon">${icon}</div>
            <div>
                <div class="tl-name">${name}</div>
                <div class="tl-symbol">${symbol}</div>
            </div>
            <div class="tl-balance">
                <span class="bal">${fmtToken(balance, '')}</span><span class="sym">${symbol}</span>
            </div>
            <div class="tl-usd">${fmtUSD(usdVal)}</div>
        </div>`;
    }

    function emptyRow(chainName) {
        return `<div class="wallet-loading-placeholder" style="color:var(--muted);font-size:0.82rem;">
            Sin activos detectados en ${chainName} — <a href="https://debank.com/profile/${WALLET}" target="_blank" style="color:var(--gold)">Ver en DeBank ↗</a>
        </div>`;
    }

    function getTokenIcon(sym) {
        const icons = { ETH:'⟠', WETH:'⟠', USDT:'₮', USDC:'◎', DAI:'◈', WBTC:'₿', BTCB:'₿', BNB:'⬡', WBNB:'⬡', MATIC:'▲', WMATIC:'▲', UNI:'🦄', AAVE:'👻', LINK:'🔗', GMX:'G', OP:'🔴', cbETH:'⟠' };
        return icons[sym] || sym.charAt(0);
    }

    let allAssetsData = {}; // { chainId: [ {name, symbol, balance, usdVal} ] }

    async function loadChainData(chainId, cfg, prices) {
        const listEl = document.getElementById(cfg.listEl);
        const totalEl = document.getElementById(cfg.totalEl);
        const nativeEl = document.getElementById(cfg.nativeEl);
        const tabEl = document.getElementById(cfg.tabEl);

        let chainTotal = 0;
        let rows = [];
        let assets = [];

        try {
            // Native balance
            const nativeBal = await getNativeBalance(cfg.rpcs, WALLET);
            const nativePrice = prices[cfg.coinId]?.usd || 0;
            const nativeUSD = nativeBal * nativePrice;
            chainTotal += nativeUSD;

            if (nativeBal > 0.00001) {
                rows.push(tokenRow(getTokenIcon(cfg.nativeSym), cfg.nativeSym, cfg.nativeSym + ' (nativo)', nativeBal, nativeUSD));
                assets.push({ name: cfg.nativeSym + ' (nativo)', symbol: cfg.nativeSym, balance: nativeBal, usdVal: nativeUSD, chain: cfg.name });
            }
            if (nativeEl) nativeEl.textContent = '— ' + fmtToken(nativeBal, cfg.nativeSym);

            // ERC-20 tokens
            const tokens = TOKENS_PER_CHAIN[chainId] || [];
            const tokenPromises = tokens.map(t => getTokenBalance(cfg.rpcs, t.addr, WALLET, t.dec).then(bal => ({ ...t, balance: bal })));
            const tokenResults = await Promise.allSettled(tokenPromises);

            for (const res of tokenResults) {
                if (res.status !== 'fulfilled') continue;
                const t = res.value;
                if (t.balance < 0.000001) continue;
                const price = prices[t.coinId]?.usd || 0;
                const usdVal = t.balance * price;
                chainTotal += usdVal;
                if (usdVal >= 0.01) {
                    rows.push(tokenRow(getTokenIcon(t.sym), t.name, t.sym, t.balance, usdVal));
                    assets.push({ name: t.name, symbol: t.sym, balance: t.balance, usdVal, chain: cfg.name });
                }
            }

            // Sort by USD value
            rows = rows.sort ? rows : rows; // already built in order
            assets.sort((a,b) => b.usdVal - a.usdVal);
            rows = assets.map(a => tokenRow(getTokenIcon(a.symbol), a.name, a.symbol, a.balance, a.usdVal));

            if (listEl) listEl.innerHTML = rows.length ? rows.join('') : emptyRow(cfg.name);
            if (totalEl) totalEl.textContent = fmtUSD(chainTotal);
            if (tabEl) tabEl.textContent = chainTotal > 0.01 ? fmtUSD(chainTotal) : '';

            allAssetsData[chainId] = assets;
            return { chainTotal, assets };

        } catch(e) {
            if (listEl) listEl.innerHTML = `<div class="wallet-loading-placeholder" style="color:#fca5a5;">Error conectando a ${cfg.name} RPC. <a href="https://debank.com/profile/${WALLET}" target="_blank" style="color:var(--gold)">Ver en DeBank ↗</a></div>`;
            if (totalEl) totalEl.textContent = '—';
            return { chainTotal: 0, assets: [] };
        }
    }

    async function loadWalletData() {
        const btn = document.getElementById('refreshBtn');
        if (btn) btn.classList.add('spinning');
        allAssetsData = {};

        // Loading state
        document.getElementById('totalUSD').innerHTML = '<span class="wallet-skeleton" style="width:160px;height:1.7rem;">&nbsp;</span>';
        document.getElementById('totalManejo').innerHTML = '<span class="wallet-skeleton" style="width:160px;height:1.7rem;">&nbsp;</span>';
        if(document.getElementById('cryptoCOP')) document.getElementById('cryptoCOP').innerHTML = '<span class="wallet-skeleton" style="width:100px;height:0.8rem;">&nbsp;</span>';
        if(document.getElementById('totalManejoSub')) document.getElementById('totalManejoSub').textContent = 'Calculando...';
        ['eth','arb','bsc','matic','op','base'].forEach(c => {
            const cfg = CHAINS[c];
            const el = document.getElementById(cfg.listEl);
            if (el) el.innerHTML = '<div class="wallet-loading-placeholder">⟳ Cargando...</div>';
        });

        try {
            // 1. Get all coin IDs needed
            const allCoinIds = ['ethereum','binancecoin','matic-network','tether','usd-coin','dai','wrapped-bitcoin','uniswap','aave','chainlink','wbnb','bitcoin-bep2','binance-usd','wmatic','optimism','gmx','coinbase-wrapped-staked-eth'];

            // 2. Fetch all prices at once
            const prices = await fetchPrices(allCoinIds);

            // 3. ETH price for header
            const ethPrice = prices['ethereum']?.usd || 0;
            const ethChange = prices['ethereum']?.usd_24h_change || null;
            document.getElementById('ethPriceMain').textContent = ethPrice > 0 ? fmtUSD(ethPrice) : '—';
            if (ethChange !== null) {
                const sign = ethChange >= 0 ? '+' : '';
                const el = document.getElementById('ethChangeMain');
                el.textContent = sign + ethChange.toFixed(2) + '% (24h)';
                el.className = 'change ' + (ethChange >= 0 ? 'up' : 'down');
            }

            // 4. Load all chains in parallel
            const chainResults = await Promise.all(
                Object.entries(CHAINS).map(([id, cfg]) => loadChainData(id, cfg, prices))
            );

            // 5. Calculate grand total
            const grandTotal = chainResults.reduce((sum, r) => sum + (isNaN(r.chainTotal) ? 0 : r.chainTotal), 0);
            document.getElementById('totalUSD').textContent = fmtUSD(grandTotal);
            document.getElementById('tab-usd-all').textContent = grandTotal > 0.01 ? fmtUSD(grandTotal) : '';
            document.getElementById('allTotal').textContent = fmtUSD(grandTotal);

            // Convertir crypto a COP y calcular Total de Manejo
            const PRESTAMOS_COP = 35048666;
            let cryptoCOP = 0;
            try {
                // Tasa USD/COP desde Frankfurter API (gratis, sin key)
                const fxRes = await fetch('https://api.frankfurter.app/latest?from=USD&to=COP', { signal: AbortSignal.timeout(6000) });
                const fxData = await fxRes.json();
                const usdToCOP = fxData.rates?.COP || 4200;
                cryptoCOP = grandTotal * usdToCOP;
                const fmtCOP = v => '$' + Math.round(v).toLocaleString('es-CO');
                document.getElementById('cryptoCOP').textContent = '≈ ' + fmtCOP(cryptoCOP) + ' COP · TRM $' + Math.round(usdToCOP).toLocaleString('es-CO');
                const totalManejoVal = cryptoCOP + PRESTAMOS_COP;
                document.getElementById('totalManejo').textContent = fmtCOP(totalManejoVal);
                document.getElementById('totalManejoSub').textContent = fmtCOP(cryptoCOP) + ' + ' + fmtCOP(PRESTAMOS_COP);
            } catch(e) {
                // Fallback TRM fija
                const usdToCOP = 4200;
                cryptoCOP = grandTotal * usdToCOP;
                const fmtCOP = v => '$' + Math.round(v).toLocaleString('es-CO');
                document.getElementById('cryptoCOP').textContent = '≈ ' + fmtCOP(cryptoCOP) + ' COP (TRM ~$4.200)';
                const totalManejoVal = cryptoCOP + PRESTAMOS_COP;
                document.getElementById('totalManejo').textContent = fmtCOP(totalManejoVal);
                document.getElementById('totalManejoSub').textContent = fmtCOP(cryptoCOP) + ' + ' + fmtCOP(PRESTAMOS_COP);
            }

            // 6. Render "All" panel — merge all assets sorted by value
            const allAssets = Object.values(allAssetsData).flat().sort((a,b) => b.usdVal - a.usdVal);
            const allRows = allAssets.map(a => {
                const chainLabel = `<span style="font-size:0.68rem;color:var(--muted);margin-left:4px;">${a.chain}</span>`;
                return `<div class="token-list-row">
                    <div class="tl-icon">${getTokenIcon(a.symbol)}</div>
                    <div>
                        <div class="tl-name">${a.name} ${chainLabel}</div>
                        <div class="tl-symbol">${a.symbol}</div>
                    </div>
                    <div class="tl-balance">
                        <span class="bal">${fmtToken(a.balance,'')}</span><span class="sym">${a.symbol}</span>
                    </div>
                    <div class="tl-usd">${fmtUSD(a.usdVal)}</div>
                </div>`;
            });
            document.getElementById('allTokensList').innerHTML = allRows.length ? allRows.join('') : emptyRow('ninguna red');

            document.getElementById('lastUpdated').textContent = 'Actualizado: ' + new Date().toLocaleTimeString('es-CO');

        } catch(e) {
            document.getElementById('totalUSD').innerHTML = '<span style="font-size:1rem;color:#fca5a5;">Error al cargar — <a href="https://debank.com/profile/' + WALLET + '" target="_blank" style="color:var(--gold)">Ver en DeBank ↗</a></span>';
        } finally {
            if (btn) btn.classList.remove('spinning');
        }
    }

    function switchChain(chainId) {
        // Update tabs
        document.querySelectorAll('.chain-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.chain-tab[data-chain="${chainId}"]`)?.classList.add('active');

        // Update panels
        document.querySelectorAll('.chain-panel').forEach(p => p.classList.remove('active'));
        const panelMap = { all:'panelAll', eth:'panelEth', arb:'panelArb', bsc:'panelBsc', matic:'panelMatic', op:'panelOp', base:'panelBase' };
        document.getElementById(panelMap[chainId])?.classList.add('active');
    }

    function copyAddress() {
        navigator.clipboard.writeText(WALLET).then(() => {
            const el = document.getElementById('addrShort');
            el.textContent = '¡Copiado!';
            setTimeout(() => { el.textContent = '0x25E6...8F38D'; }, 1800);
        });
    }

    window.addEventListener('load', loadWalletData);
    setInterval(loadWalletData, 120000);