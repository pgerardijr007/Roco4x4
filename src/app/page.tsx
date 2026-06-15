'use client';

import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import { get, set } from 'idb-keyval';

interface Product {
  'Unnamed: 0': string | number;
  'Unnamed: 1': string;
  'Unnamed: 2': number | string;
  aiContext?: string;
}

interface CategorizedResult {
  category: string;
  parts: Product[];
}

// Phase 8: Cart Quantum Structure
interface CartItem {
  product: Product;
  quantity: number;
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [database, setDatabase] = useState<Product[]>([]);
  const [results, setResults] = useState<CategorizedResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Booting system...');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalSearch, setGlobalSearch] = useState('');
  
  const [viewMode, setViewMode] = useState<'ai' | 'master' | 'pdf' | 'excel'>('ai');
  const [openMasterLetter, setOpenMasterLetter] = useState<string | null>(null);
  
  const [openBrand, setOpenBrand] = useState<string | null>(null);
  const [openModel, setOpenModel] = useState<string | null>(null);
  const toggleBrand = (brand: string) => { setOpenBrand(prev => prev === brand ? null : brand); setOpenModel(null); };
  const toggleModel = (model: string) => setOpenModel(prev => prev === model ? null : model);

  const [showTutorial, setShowTutorial] = useState(false);
  const [hideTutorialForever, setHideTutorialForever] = useState(false);
  
  // Phase 9: PWA Standalone State Handlers
  const [isStandalone, setIsStandalone] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [devicePlatform, setDevicePlatform] = useState<string>('unknown');
  const [activeSimulator, setActiveSimulator] = useState<'ios' | 'mac' | null>(null);
  
  // Phase 8: Financial States
  const [margin, setMargin] = useState<number>(1.0);
  const [currency, setCurrency] = useState<string>('AUD');
  const [rates, setRates] = useState<Record<string, number>>({ AUD: 1, USD: 0.70, EUR: 0.65, NZD: 1.10, GBP: 0.55 });
  const currencySymbols: Record<string, string> = { AUD: '$', USD: '$', EUR: '€', NZD: '$', GBP: '£' };

  const vehicleIndex = [
    { brand: 'Toyota', models: [ { name: 'Hilux', years: ['2015-Onwards', '2005-2015', '1997-2005'] }, { name: 'Land Cruiser', years: ['300 Series', '200 Series', '100 Series', '79 Series V8', '70 Series Pre-V8'] }, { name: 'Prado', years: ['150 Series', '120 Series', '90 Series'] }, { name: 'Tacoma', years: ['2016-Onwards', '2005-2015'] }, { name: 'Tundra', years: ['2022-Onwards', '2007-2021'] }, { name: '4Runner', years: ['2010-Onwards (5th Gen)', '2003-2009 (4th Gen)'] }, { name: 'FJ Cruiser', years: ['All Years'] } ] },
    { brand: 'Ford', models: [ { name: 'Ranger', years: ['Next-Gen (2022-Onwards)', 'PX3 (2018-2022)', 'PX2 (2015-2018)', 'PX (2011-2015)'] }, { name: 'Everest', years: ['Next-Gen (2022-Onwards)', 'UA (2015-2022)'] }, { name: 'Bronco', years: ['2021-Onwards'] }, { name: 'F-150', years: ['2021-Onwards', '2015-2020'] } ] },
    { brand: 'Nissan', models: [ { name: 'Patrol', years: ['Y62 (2010+)', 'Y61/GU', 'Y60/GQ'] }, { name: 'Navara', years: ['NP300 (2015+)', 'D40 (2005-2015)'] } ] },
    { brand: 'Jeep', models: [ { name: 'Wrangler', years: ['JL (2018+)', 'JK (2007-2018)'] }, { name: 'Gladiator', years: ['JT (2020+)'] }, { name: 'Grand Cherokee', years: ['WL (2021+)', 'WK2 (2011-2021)'] } ] },
    { brand: 'Mitsubishi', models: [ { name: 'Triton', years: ['MR (2019+)', 'MQ (2015-2018)'] }, { name: 'Pajero', years: ['NX/NW/NT (2007+)', 'NM/NP'] }, { name: 'Pajero Sport', years: ['QE/QF (2015+)'] } ] },
    { brand: 'Holden/Isuzu', models: [ { name: 'D-MAX', years: ['RG (2020+)', 'RT (2012-2019)'] }, { name: 'MU-X', years: ['RJ (2021+)', 'RF (2013-2020)'] }, { name: 'Colorado', years: ['RG (2012-2020)', 'RC (2008-2012)'] } ] },
    { brand: 'Land Rover', models: [ { name: 'Defender', years: ['L663 (2020+)', 'Traditional (Pre-2016)'] }, { name: 'Discovery', years: ['Discovery 4', 'Discovery 3'] } ] },
    { brand: 'Volkswagen', models: [ { name: 'Amarok', years: ['NF (2023+)', 'Original (2010-2022)'] } ] },
    { brand: 'Suzuki', models: [ { name: 'Jimny', years: ['JB74 (2019+)', 'Sierra/Previous Gen'] }, { name: 'Grand Vitara', years: ['All Years'] } ] },
    { brand: 'Mazda', models: [ { name: 'BT-50', years: ['TF (2020+)', 'UP/UR (2011-2020)'] } ] },
    { brand: 'Lexus', models: [ { name: 'GX', years: ['GX460', 'GX470'] }, { name: 'LX', years: ['LX570', 'LX470'] } ] },
    { brand: 'Mercedes-Benz', models: [ { name: 'X-Class', years: ['All Years'] }, { name: 'G-Wagen', years: ['G-Professional', 'Standard G-Class'] } ] },
    { brand: 'Chevrolet', models: [ { name: 'Silverado', years: ['1500 (Current Gen)', '2500HD'] } ] }
  ];

  const masterGroups = useMemo(() => {
     if (database.length === 0) return {};
     const groups: Record<string, Product[]> = {};
     database.forEach(p => {
         const pstr = String(p['Unnamed: 0']).toUpperCase();
         const prefix = pstr.charAt(0);
         const key = prefix.match(/[A-Z]/) ? prefix : '# (Numeric)';
         if (!groups[key]) groups[key] = [];
         groups[key].push(p);
     });
     return Object.keys(groups).sort().reduce(
       (obj: any, key) => { 
         obj[key] = groups[key]; 
         return obj;
       }, 
       {}
     );
  }, [database]);

  useEffect(() => {
    // Phase 8: Financial Legacy Array Patching Hook
    const savedCart = localStorage.getItem('roco_cart_v3');
    if (savedCart) { 
        try { 
            const parsed = JSON.parse(savedCart);
            setCart(parsed);
        } catch (e) {} 
    } else {
        const legacyCart = localStorage.getItem('roco_cart_v2');
        if (legacyCart) {
            try {
                const parsed = JSON.parse(legacyCart);
                if (Array.isArray(parsed)) {
                    setCart(parsed.map((p: any) => p.product ? p : { product: p, quantity: 1 }));
                }
            } catch(e) {}
        }
    }

    if (!localStorage.getItem('roco_tutorial_cleared')) {
        setShowTutorial(true);
    }

    const initializeDB = async () => {
        try {
            // Live FX Polling
            fetch('https://api.exchangerate-api.com/v4/latest/AUD')
              .then(res => res.json())
              .then(data => { if(data && data.rates) setRates(data.rates); })
              .catch(e => console.error("FX Network Failed", e));

            const cachedDB = await get('roco_master_db_cache');
            if (cachedDB) {
                setDatabase(cachedDB);
                setLoadingText('Ready (Loaded from secure local memory in 0.01s)');
                setIsLoading(false);
            }

            const bucketUrl = `/master_database.json`;
            const headerRes = await fetch(bucketUrl, { method: 'HEAD' });
            const etag = headerRes.headers.get('etag');
            const cachedEtag = localStorage.getItem('roco_master_etag');

            if (!cachedDB || etag !== cachedEtag) {
                setLoadingText('Synchronizing Network Database update...');
                const res = await fetch(bucketUrl);
                const newData = await res.json();
                await set('roco_master_db_cache', newData);
                if (etag) localStorage.setItem('roco_master_etag', etag);
                setDatabase(newData);
                setLoadingText('Ready (Synced with Global DB)');
                setIsLoading(false);
            }
        } catch (e) {
            console.error('Core Engine Init Error:', e);
            setLoadingText('Offline Mode (Could not sync DB)');
            setIsLoading(false);
        }
    };
    initializeDB();

    // Phase 9: PWA Service Worker Hook
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => { console.log('PWA ServiceWorker registration successful'); },
          (err) => { console.error('PWA ServiceWorker registration failed: ', err); }
        );
      });
    }

    // Phase 9: PWA Web Blocker Logic
    const checkStandalone = () => {
        const ua = navigator.userAgent.toLowerCase();
        const isApp = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true ||
                      ua.includes('nativefier') ||
                      ua.includes('electron') ||
                      localStorage.getItem('roco_bypass_install') === 'true';
        setIsStandalone(isApp);
    };
    checkStandalone();

    const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // OS Detection
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) setDevicePlatform('windows');
    else if (ua.includes('mac') && !ua.includes('iphone') && !ua.includes('ipad')) setDevicePlatform('mac');
    else if (ua.includes('android')) setDevicePlatform('android');
    else if (ua.includes('iphone') || ua.includes('ipad')) setDevicePlatform('ios');
    else setDevicePlatform('unknown');

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { localStorage.setItem('roco_cart_v3', JSON.stringify(cart)); }, [cart]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'roco2026') setIsAuthenticated(true);
    else alert('Authentication Failed. Access Denied.');
  };

  const closeTutorial = () => {
      if (hideTutorialForever) {
          localStorage.setItem('roco_tutorial_cleared', 'true');
      }
      setShowTutorial(false);
  };

  const executeGlobalSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (!globalSearch.trim()) return;
      setViewMode('ai');
      const term = globalSearch.toUpperCase();
      const hits = database.filter(p => String(p['Unnamed: 0']).toUpperCase().includes(term) || String(p['Unnamed: 1']).toUpperCase().includes(term));
      setResults([{ category: `Search Results for "${globalSearch}"`, parts: hits }]);
  };

  const executeAIQuery = async (vehicleCtx: string) => {
    setViewMode('ai');
    setIsLoading(true);
    setLoadingText('AI parsing physical catalogue architecture...');
    setResults([]);
    
    const query = `Provide a full structural parts list for exactly the ${vehicleCtx}. You must preserve category headers.`;
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      let replyText = data.reply || '';
      let catMap: Record<string, Product[]> = {};
      let currentHeader = 'General Component List';

      const lines = replyText.split('\n');
      lines.forEach((line: string) => {
          if (line.match(/^###?\s+(.*)/)) {
             currentHeader = line.replace(/^###?\s+/, '').replace(/\*\*/g, '').trim();
          } else {
             const rawTags = line.match(/\[\[PART:(.*?)\]\]/g);
             if (rawTags) {
                 rawTags.forEach((tag: string) => {
                     const pNum = tag.replace(/\[\[PART:|\]\]/g, '').trim().toUpperCase();
                     let cleanContext = line.replace(tag, '').replace(/^- \*\*(.*?)\*\*:/, '$1:').replace(/^- /, '').trim();
                     const dbItem = database.find(p => String(p['Unnamed: 0']).toUpperCase() === pNum && pNum.length > 1);
                     if (dbItem) {
                         if (!catMap[currentHeader]) catMap[currentHeader] = [];
                         if (!catMap[currentHeader].find(i => String(i['Unnamed: 0']) === pNum)) {
                            catMap[currentHeader].push({ ...dbItem, aiContext: cleanContext || 'Specified in Catalogue PDF' });
                         }
                     }
                 });
             } else if (line.includes('|') && !line.includes('---')) {
                 const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
                 cells.forEach(cell => {
                     const exactDbMatch = database.find(p => String(p['Unnamed: 0']).toUpperCase() === cell.toUpperCase() && cell.length > 2);
                     if (exactDbMatch) {
                         if (!catMap[currentHeader]) catMap[currentHeader] = [];
                         if (!catMap[currentHeader].find(i => String(i['Unnamed: 0']) === String(exactDbMatch['Unnamed: 0']))) {
                             const cleanLine = line.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
                             catMap[currentHeader].push({ ...exactDbMatch, aiContext: 'Found strictly in PDF table line: ' + cleanLine });
                         }
                     }
                 });
             }
          }
      });

      const finalArr: CategorizedResult[] = Object.keys(catMap).map(k => ({ category: k, parts: catMap[k] }));
      setResults(finalArr.length > 0 ? finalArr : [{ category: 'AI Process Complete (No Direct Matches Found)', parts: [] }]);
    } catch (err: any) {
      alert("AI Search Failed: " + err.message);
    }
    setIsLoading(false);
  };

  // Phase 8: Smart Quantity Engine
  const addToCart = (item: Product) => { 
      setCart(prev => {
          const existingIdx = prev.findIndex(c => String(c.product['Unnamed: 0']) === String(item['Unnamed: 0']));
          if (existingIdx >= 0) {
              const newArr = [...prev];
              newArr[existingIdx].quantity += 1;
              return newArr;
          } else {
              // Auto-2 Interceptor Macro
              const stringCheck = (String(item['Unnamed: 1']) + " " + String(item.aiContext)).toUpperCase();
              const needsTwo = /SHOCK|STRUT|COIL/.test(stringCheck);
              return [...prev, { product: item, quantity: needsTwo ? 2 : 1 }];
          }
      });
  };

  const updateQuantity = (idx: number, delta: number) => {
      setCart(prev => {
          const newArr = [...prev];
          const calculated = newArr[idx].quantity + delta;
          if (calculated < 1) return prev; 
          newArr[idx].quantity = calculated;
          return newArr;
      });
  };

  const removeFromCart = (index: number) => setCart(prev => prev.filter((_, i) => i !== index));

  // Phase 8: Dynamic Currency Formatting
  const formatFinancial = (val: any, qty: number = 1) => { 
      const rawNum = Number(val);
      if (isNaN(rawNum)) return val || '$0.00'; 
      
      const fxRate = rates[currency] || 1.0;
      const calculated = rawNum * qty * margin * fxRate;
      const symbol = currencySymbols[currency] || currency + ' ';
      return symbol + calculated.toFixed(2); 
  };
  
  const baseSubtotal = cart.reduce((sum, item) => sum + ((Number(item.product['Unnamed: 2']) || 0) * item.quantity), 0);
  const fxRate = rates[currency] || 1.0;
  const finalExchangeTotal = baseSubtotal * margin * fxRate;
  const activeSymbol = currencySymbols[currency] || currency + ' ';

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1 className="login-title">ROCO <span>4X4</span></h1>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="Passcode" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            <button type="submit" className="btn-primary">AUTHENTICATE</button>
          </form>
        </div>
      </div>
    );
  }
  // Phase 9: PWA App Hub / Download Gate
  if (!isStandalone) {
      return (
          <div className="hub-container">
              <div className="hub-glow-1"></div>
              <div className="hub-glow-2"></div>
              
              <div className="hub-wrapper">
                  <h1 className="hub-logo">ROCO <span>4X4</span></h1>
                  <p className="hub-subtitle">
                      Access the Catalog Engine as a high-performance desktop or mobile application. Select your platform below for instant, zero-friction installation.
                  </p>

                  <div className="hub-grid">
                      {/* Windows Card */}
                      <div 
                          className="hub-card" 
                          onClick={() => {
                              window.location.href = "/Roco_4x4_Setup.exe";
                          }}
                      >
                          <div className="hub-card-badge windows-badge">NATIVE (.EXE)</div>
                          <div className="hub-card-icon">🪟</div>
                          <h3 className="hub-card-title">Windows App</h3>
                          <div className="hub-card-platform">Windows PC</div>
                          <p className="hub-card-desc">
                              Download a native 1-click silent installer. Pins a shortcut directly to your Desktop.
                          </p>
                          <button className="hub-card-btn">⬇️ Download Installer</button>
                      </div>

                      {/* Android Card */}
                      <div 
                          className="hub-card recommended"
                          onClick={() => {
                              if (deferredPrompt) {
                                  deferredPrompt.prompt();
                                  deferredPrompt.userChoice.then((choiceResult: any) => {
                                      if (choiceResult.outcome === 'accepted') {
                                          setDeferredPrompt(null);
                                      }
                                  });
                              } else {
                                  alert("Chrome PWA installation is active. To install manually, tap the browser's menu (three dots) and select 'Install App' or 'Add to Home screen'.");
                              }
                          }}
                      >
                          <div className="hub-card-badge">RECOMMENDED</div>
                          <div className="hub-card-icon">🤖</div>
                          <h3 className="hub-card-title">Android App</h3>
                          <div className="hub-card-platform">Android Mobile</div>
                          <p className="hub-card-desc">
                              Install the PWA app directly on your phone in one click. Fully supports offline catalog viewing.
                          </p>
                          <button className="hub-card-btn">📱 Install Android App</button>
                      </div>

                      {/* iOS Card */}
                      <div 
                          className="hub-card"
                          onClick={() => setActiveSimulator('ios')}
                      >
                          <div className="hub-card-badge">APPLE MOBILE</div>
                          <div className="hub-card-icon">🍏</div>
                          <h3 className="hub-card-title">Apple iOS App</h3>
                          <div className="hub-card-platform">iPhone / iPad</div>
                          <p className="hub-card-desc">
                              Add to your iPhone Home Screen via Safari. Zero downloads or Apple App Store login required.
                          </p>
                          <button className="hub-card-btn">📱 View iOS Guide</button>
                      </div>

                      {/* macOS Card */}
                      <div 
                          className="hub-card"
                          onClick={() => setActiveSimulator('mac')}
                      >
                          <div className="hub-card-badge">APPLE DESKTOP</div>
                          <div className="hub-card-icon">💻</div>
                          <h3 className="hub-card-title">Apple Mac App</h3>
                          <div className="hub-card-platform">macOS Desktop</div>
                          <p className="hub-card-desc">
                              Add directly to your Dock in Safari or Chrome. Launches in a clean, borderless app frame.
                          </p>
                          <button className="hub-card-btn">🖥️ View Mac Guide</button>
                      </div>
                  </div>

                  <div className="hub-bypass-wrapper">
                      <button 
                          onClick={() => {
                              localStorage.setItem('roco_bypass_install', 'true');
                              setIsStandalone(true);
                          }}
                          className="hub-bypass-btn"
                      >
                          Skip installation, run in browser (Run Web Version) →
                      </button>
                  </div>
              </div>

              {/* iOS Simulator Modal */}
              {activeSimulator === 'ios' && (
                  <div className="sim-overlay" onClick={() => setActiveSimulator(null)}>
                      <div className="sim-container" onClick={(e) => e.stopPropagation()}>
                          <button className="sim-close-btn" onClick={() => setActiveSimulator(null)}>×</button>
                          
                          <div className="sim-visual-side">
                              <div className="phone-frame">
                                  <div className="phone-notch"></div>
                                  <div className="phone-screen">
                                      <div className="phone-app-mockup">
                                          <div className="phone-app-logo">ROCO <span>4X4</span></div>
                                          <div className="phone-app-tag">App Installation Center</div>
                                      </div>
                                      
                                      <div className="phone-safari-drawer">
                                          <div className="drawer-title">Options</div>
                                          <div className="drawer-options">
                                              <div className="drawer-option">
                                                  <span>Copy Link</span>
                                                  <span>🔗</span>
                                              </div>
                                              <div className="drawer-option pulse-highlight">
                                                  <strong>Add to Home Screen</strong>
                                                  <span>➕</span>
                                              </div>
                                              <div className="drawer-option">
                                                  <span>Find on Page</span>
                                                  <span>🔍</span>
                                              </div>
                                          </div>
                                      </div>
                                      
                                      <div className="phone-safari-bar">
                                          <span>◀</span>
                                          <span>▶</span>
                                          <span className="safari-action-icon highlight">📤</span>
                                          <span>📖</span>
                                          <span>☷</span>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <div className="sim-info-side">
                              <span className="sim-platform-badge">Apple iOS Installation</span>
                              <h2 className="sim-title">Add to Home Screen</h2>
                              <p className="sim-desc">
                                  To install the Roco 4x4 app on your iPhone or iPad, follow these simple steps using the Safari web browser:
                              </p>
                              <div className="sim-steps">
                                  <div className="sim-step">
                                      <div className="sim-step-num">1</div>
                                      <p className="sim-step-text">
                                          Tap the <strong>Share button</strong> (📤) in the bottom toolbar of Safari (highlighted in red).
                                      </p>
                                  </div>
                                  <div className="sim-step">
                                      <div className="sim-step-num">2</div>
                                      <p className="sim-step-text">
                                          Scroll down the sharing menu and select <strong>Add to Home Screen</strong> (➕).
                                      </p>
                                  </div>
                                  <div className="sim-step">
                                      <div className="sim-step-num">3</div>
                                      <p className="sim-step-text">
                                          Tap <strong>Add</strong> in the top right-hand corner. The app icon will appear instantly on your home screen!
                                      </p>
                                  </div>
                              </div>
                              <button className="sim-footer-btn" onClick={() => setActiveSimulator(null)}>Acknowledge</button>
                          </div>
                      </div>
                  </div>
              )}

              {/* Mac Simulator Modal */}
              {activeSimulator === 'mac' && (
                  <div className="sim-overlay" onClick={() => setActiveSimulator(null)}>
                      <div className="sim-container" onClick={(e) => e.stopPropagation()}>
                          <button className="sim-close-btn" onClick={() => setActiveSimulator(null)}>×</button>
                          
                          <div className="sim-visual-side">
                              <div className="mac-frame">
                                  <div className="mac-titlebar">
                                      <div className="mac-dot-container">
                                          <div className="mac-dot"></div>
                                          <div className="mac-dot"></div>
                                          <div className="mac-dot"></div>
                                      </div>
                                      <div className="mac-addressbar">
                                          roco4x4.app
                                      </div>
                                      <span className="mac-install-icon highlight">📥</span>
                                  </div>
                                  <div className="mac-screen-content">
                                      <div className="phone-app-logo" style={{fontSize: '1.4rem'}}>ROCO <span>4X4</span></div>
                                      <div className="phone-app-tag" style={{fontSize: '0.6rem'}}>macOS Portal</div>
                                  </div>
                              </div>
                          </div>

                          <div className="sim-info-side">
                              <span className="sim-platform-badge mac-badge">Apple macOS Installation</span>
                              <h2 className="sim-title">Install Mac App</h2>
                              <p className="sim-desc">
                                  On Apple Macs, you can run this portal as a lightweight standalone window through Chrome or Safari:
                              </p>
                              <div className="sim-steps">
                                  <div className="sim-step">
                                      <div className="sim-step-num">1</div>
                                      <p className="sim-step-text">
                                          <strong>If using Safari:</strong> Click <strong>File</strong> in the top macOS menu bar, then choose <strong>Add to Dock...</strong>
                                      </p>
                                  </div>
                                  <div className="sim-step">
                                      <div className="sim-step-num">2</div>
                                      <p className="sim-step-text">
                                          <strong>If using Google Chrome:</strong> Click the <strong>Install App icon</strong> (📥) in the right side of the address bar (highlighted in cyan).
                                      </p>
                                  </div>
                                  <div className="sim-step">
                                      <div className="sim-step-num">3</div>
                                      <p className="sim-step-text">
                                          The app will instantly launch as a separate desktop application on your Mac, complete with a Dock icon!
                                      </p>
                                  </div>
                              </div>
                              <button className="sim-footer-btn" onClick={() => setActiveSimulator(null)}>Acknowledge</button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  return (
    <div className="layout-v2">
        {showTutorial && (
            <div className="modal-overlay noprint">
                <div className="modal-content">
                    <h2>Welcome to ROCO<span>4X4</span></h2>
                    <p>This automated portal structurally merges our physical 400-page OME catalogue instantly with our raw pricing database.</p>
                    
                    <div className="modal-steps">
                        <div className="modal-step">
                            <div className="step-num">1</div>
                            <div className="step-text"><strong>The Engine:</strong> Click a vehicle in the left Index to command the AI to structurally extract the catalog geometry, or click [BROWSE ENTIRE INVENTORY] to view all 14,000 internal items manually.</div>
                        </div>
                        <div className="modal-step">
                            <div className="step-num">2</div>
                            <div className="step-text"><strong>The Portfolio:</strong> Hit the "+ Append to Cart" button on any part to drop it directly into your live Estimate Drawer on the right. Shocks and Coils will automatically stack to QTY 2.</div>
                        </div>
                        <div className="modal-step">
                            <div className="step-num">3</div>
                            <div className="step-text"><strong>The Quote:</strong> Use the powerful Financial Engine at the bottom of the cart to instantly set Global Profit Margins and live International Exchange rates before printing the final PDF geometry!</div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <label className="modal-check">
                            <input type="checkbox" checked={hideTutorialForever} onChange={(e) => setHideTutorialForever(e.target.checked)} />
                            Do not show this wizard again.
                        </label>
                        <button className="modal-btn" onClick={closeTutorial}>ACKNOWLEDGE</button>
                    </div>
                </div>
            </div>
        )}

        <header className="global-header noprint">
            <div className="logo-area">
                <h1>ROCO<span>4X4</span> <span className="subtitle">Catalogue Explorer</span></h1>
            </div>
            
            <div className="header-actions" style={{display:'flex', gap:'10px'}}>
                <button className={`btn-top-nav ${viewMode === 'master' ? 'active' : ''}`} onClick={() => setViewMode(prev => prev === 'master' ? 'ai' : 'master')}>
                  {viewMode === 'master' ? '← RETURN TO AI DASHBOARD' : '🗄️ BROWSE ENTIRE INVENTORY'}
                </button>
                <button className={`btn-top-nav ${viewMode === 'pdf' ? 'active' : ''}`} onClick={() => setViewMode(prev => prev === 'pdf' ? 'ai' : 'pdf')}>
                  {viewMode === 'pdf' ? '← RETURN TO AI DASHBOARD' : '📖 VIEW ORIGINAL PDF'}
                </button>
                <button className={`btn-top-nav ${viewMode === 'excel' ? 'active' : ''}`} onClick={() => setViewMode(prev => prev === 'excel' ? 'ai' : 'excel')}>
                  {viewMode === 'excel' ? '← RETURN TO AI DASHBOARD' : '📊 VIEW RAW DATABASE'}
                </button>
            </div>

            <form className="search-bar-wrapper" style={{marginLeft:'auto'}} onSubmit={executeGlobalSearch}>
                <input type="text" placeholder="Instance Search (Part # or Description)" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} />
                <button type="submit">🔍</button>
            </form>
        </header>

        <div className="workspace">
            <aside className="left-nav noprint">
                <div style={{marginBottom:'10px', fontSize:'0.85rem', color: isLoading ? '#ffeb3b' : '#4caf50'}}>
                    {isLoading ? <span className="shimmer-text">● {loadingText}</span> : `● Ready (${database.length} Items Indexed)`}
                </div>
                <h2>VEHICLE INDEX</h2>
                <div className="nav-accordion">
                  {vehicleIndex.map((brandInfo, i) => (
                    <div key={i} className="nav-brand">
                        <div className="nav-brand-header" onClick={() => toggleBrand(brandInfo.brand)}>
                            {brandInfo.brand} {openBrand === brandInfo.brand ? '▼' : '▶'}
                        </div>
                        {openBrand === brandInfo.brand && (
                            <div className="nav-models">
                                {brandInfo.models.map((modelInfo, j) => (
                                    <div key={j} className="nav-model">
                                        <div className="nav-model-header" onClick={() => toggleModel(modelInfo.name)}>
                                            {modelInfo.name} {openModel === modelInfo.name ? '▼' : '▶'}
                                        </div>
                                        {openModel === modelInfo.name && (
                                            <div className="nav-years">
                                                {modelInfo.years.map((year, k) => (
                                                    <div key={k} className="nav-year" onClick={() => executeAIQuery(`${year} ${brandInfo.brand} ${modelInfo.name}`)}>
                                                        {year}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                  ))}
                </div>
            </aside>

            <main className="central-canvas noprint">
                
                {viewMode === 'pdf' && (
                    <div className="pdf-viewer-wrapper" style={{ width: '100%', height: '100%', minHeight: '800px', display: 'flex', flexDirection: 'column' }}>
                       <div className="master-header">
                            <h2>Raw Catalogue Source (OME April 2024.pdf)</h2>
                            <p>Direct view of the physical master architecture used by the AI engine.</p>
                       </div>
                       <iframe src="https://ijtkbisxyoondehvcqza.supabase.co/storage/v1/object/public/roco-assets/OME_Catalogue.pdf" style={{ width: '100%', flexGrow: 1, border: 'none', borderRadius: '8px', backgroundColor: '#333' }} title="OME Master PDF" />
                    </div>
                )}

                {viewMode === 'excel' && (
                    <div className="raw-excel-wrapper">
                        <div className="master-header">
                            <h2>Raw Database Table (Supabase Array)</h2>
                            <p>Displaying all {database.length} mathematical rows loaded accurately from the server.</p>
                        </div>
                        <div className="raw-grid-container">
                            <table className="raw-grid-table">
                                <thead><tr><th>[A] Part Number</th><th>[B] Raw Excel Description</th><th>[C] Static Retail Price</th><th>Action</th></tr></thead>
                                <tbody>
                                    {database.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="raw-num">{item['Unnamed: 0']}</td>
                                            <td>{item['Unnamed: 1']}</td>
                                            <td className="raw-price" style={{color:'black'}}>${Number(item['Unnamed: 2']).toFixed(2)}</td>
                                            <td><button className="btn-add-quote-small" onClick={(e) => { e.stopPropagation(); addToCart(item); }}>+ Cart</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {viewMode === 'master' && (
                    <div className="master-inventory-wrapper">
                        <div className="master-header">
                            <h2>Master Inventory Database</h2>
                            <p>Showing {database.length} mathematically isolated records.</p>
                        </div>
                        {Object.keys(masterGroups).map(letter => (
                            <details key={letter} className="master-alphabet-block" open={openMasterLetter === letter} onClick={(e) => { e.preventDefault(); setOpenMasterLetter(prev => prev === letter ? null : letter); }}>
                                <summary className="master-alphabet-title">Prefix Block: <span>{letter}</span> ({masterGroups[letter].length} items)</summary>
                                {openMasterLetter === letter && (
                                    <div className="master-grid">
                                        {masterGroups[letter].map((item: Product, idx: number) => (
                                            <div key={idx} className="mc-row">
                                                <div className="mc-pnum">{item['Unnamed: 0']}</div>
                                                <div className="mc-desc">{item['Unnamed: 1']}</div>
                                                <div className="mc-price">${Number(item['Unnamed: 2']).toFixed(2)}</div>
                                                <button className="btn-add-quote-small" onClick={(e) => { e.stopPropagation(); addToCart(item); }}>+ Cart</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </details>
                        ))}
                    </div>
                )}

                {viewMode === 'ai' && isLoading && results.length === 0 && (
                    <div className="skeleton-layout">
                       {[1,2,3].map(i => (
                           <div key={i} className="skeleton-block">
                               <div className="skeleton-header shimmer"></div>
                               <div className="skeleton-card shimmer"></div>
                               <div className="skeleton-card shimmer"></div>
                           </div>
                       ))}
                    </div>
                )}

                {viewMode === 'ai' && !isLoading && results.length === 0 && (
                    <div className="empty-canvas noprint">
                        <svg className="watermark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
                        <p>Select a vehicle to dramatically generate the PDF layout sequence.</p>
                    </div>
                )}
                
                {viewMode === 'ai' && results.length > 0 && (
                    <div className="catalogue-wrapper" style={{ opacity: isLoading ? 0.3 : 1, transition: '0.2s' }}>
                        {results.map((category, i) => (
                            <details key={i} className="category-block" open>
                                <summary className="category-title">{category.category.toUpperCase()} <span className="cat-count">({category.parts.length} items)</span></summary>
                                <div className="category-parts">
                                    {category.parts.map((p, j) => {
                                        const pNum = String(p['Unnamed: 0']);
                                        const excelDesc = p['Unnamed: 1'];
                                        const pdfDesc = p.aiContext;
                                        const originalPriceStr = `$${Number(p['Unnamed: 2']).toFixed(2)} AUD`;
                                        
                                        return (
                                            <div key={j} className="part-card">
                                                <div className="pc-top">
                                                    <span className="pc-pnum">{pNum}</span>
                                                    <span className="pc-price">{originalPriceStr}</span>
                                                </div>
                                                <div className="pc-desc">{pdfDesc || excelDesc}</div>
                                                <div className="pc-context">
                                                    <span className="ai-icon">📋</span> DB Match: {excelDesc}
                                                </div>
                                                <button className="btn-add-quote noprint" onClick={() => addToCart(p)}>+ Append to Cart</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </details>
                        ))}
                    </div>
                )}
            </main>

            <aside className="right-drawer">
                <div className="drawer-header noprint">
                    <h2>ESTIMATE PORTFOLIO</h2>
                    <button className="btn-print" onClick={() => window.print()}>🖨️ PDF</button>
                </div>
                
                <div className="drawer-items" style={{paddingBottom: '0'}}>
                    <div className="print-header" style={{display:'none'}}>Roco 4x4 Estimate Receipt</div>
                    {cart.map((c, idx) => (
                        <div key={idx} className="drawer-item">
                            <div className="di-info">
                                <strong>{c.product['Unnamed: 0']}</strong>
                                <span className="di-desc" style={{marginBottom: '5px', display: 'block'}}>{c.product['Unnamed: 1']}</span>
                                
                                {/* Phase 8: Physical QTY Stepper UI */}
                                <div className="qty-stepper noprint">
                                    <button className="btn-qty" onClick={() => updateQuantity(idx, -1)}>-</button>
                                    <span className="qty-display">QTY: {c.quantity}</span>
                                    <button className="btn-qty" onClick={() => updateQuantity(idx, 1)}>+</button>
                                </div>
                                <div className="print-only-qty" style={{display:'none'}}>QTY: {c.quantity}</div>
                            </div>
                            <div className="di-price" style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px'}}>
                                <span>{formatFinancial(c.product['Unnamed: 2'], c.quantity)}</span>
                            </div>
                            <button className="btn-remove noprint" onClick={() => removeFromCart(idx)}>×</button>
                        </div>
                    ))}
                    {cart.length === 0 && <div className="empty-cart noprint">No items loaded into portfolio.</div>}
                </div>
                
                {/* Phase 8: Financial Modifiers Block */}
                <div className="financial-controls noprint">
                    <div className="financial-row">
                        <span>Global Net Margin:</span>
                        <select value={margin} onChange={e => setMargin(Number(e.target.value))}>
                            <option value={1.0}>Base (+0%)</option>
                            <option value={1.1}>+10% Markup</option>
                            <option value={1.2}>+20% Markup</option>
                            <option value={1.3}>+30% Markup</option>
                            <option value={1.4}>+40% Markup</option>
                            <option value={1.5}>+50% Markup</option>
                        </select>
                    </div>
                    <div className="financial-row">
                        <span>Live FX Target:</span>
                        <select value={currency} onChange={e => setCurrency(e.target.value)}>
                            <option value="AUD">🇦🇺 AUD (Native)</option>
                            <option value="USD">🇺🇸 USD (US Dollar)</option>
                            <option value="EUR">🇪🇺 EUR (Euro)</option>
                            <option value="NZD">🇳🇿 NZD (New Zealand)</option>
                            <option value="GBP">🇬🇧 GBP (British Pound)</option>
                        </select>
                    </div>
                </div>

                <div className="drawer-footer">
                    <h3>SUBTOTAL: <span>{activeSymbol}{finalExchangeTotal.toFixed(2)} {currency !== 'AUD' ? currency : 'AUD'}</span></h3>
                </div>
            </aside>
        </div>
    </div>
  );
}
