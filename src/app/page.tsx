'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import * as XLSX from 'xlsx';

// Types for our product data
interface Product {
  'Unnamed: 0': string | number;
  'Unnamed: 1': string;
  'Unnamed: 2': number | string;
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // App State
  const [database, setDatabase] = useState<Product[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [messages, setMessages] = useState<{sender: 'bot' | 'user', text: string}[]>([
    { sender: 'bot', text: 'Welcome back to the Roco 4x4 Assistant. Type a vehicle model or part name to instantly search the inventory.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New Upgraded Feature States
  const [cart, setCart] = useState<Product[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  
  // Tabbed Index States
  const [rightTab, setRightTab] = useState<'index' | 'cart'>('index');
  const [openBrand, setOpenBrand] = useState<string | null>(null);
  const [openModel, setOpenModel] = useState<string | null>(null);
  const toggleBrand = (brand: string) => { setOpenBrand(prev => prev === brand ? null : brand); setOpenModel(null); };
  const toggleModel = (model: string) => setOpenModel(prev => prev === model ? null : model);

  const vehicleIndex = [
    { 
      brand: 'Toyota', 
      models: [
        { name: 'Hilux', years: ['2015-Onwards', '2005-2015', '1997-2005'] },
        { name: 'Land Cruiser', years: ['300 Series', '200 Series', '100 Series', '79 Series V8', '70 Series Pre-V8'] },
        { name: 'Prado', years: ['150 Series', '120 Series', '90 Series'] },
        { name: 'Tacoma', years: ['2016-Onwards', '2005-2015'] },
        { name: 'Tundra', years: ['2022-Onwards', '2007-2021'] },
        { name: '4Runner', years: ['2010-Onwards (5th Gen)', '2003-2009 (4th Gen)'] }
      ] 
    },
    { 
      brand: 'Ford', 
      models: [
        { name: 'Ranger', years: ['Next-Gen (2022-Onwards)', 'PX3 (2018-2022)', 'PX2 (2015-2018)', 'PX (2011-2015)'] },
        { name: 'Everest', years: ['Next-Gen (2022-Onwards)', 'UA (2015-2022)'] },
        { name: 'Bronco', years: ['2021-Onwards'] },
        { name: 'F-150', years: ['2021-Onwards', '2015-2020'] }
      ] 
    },
    { 
      brand: 'Nissan', 
      models: [
        { name: 'Navara', years: ['NP300 / D23', 'D40', 'D22'] },
        { name: 'Patrol', years: ['Y62', 'GU / Y61', 'GQ / Y60'] },
        { name: 'Pathfinder', years: ['R51', 'R50'] }
      ] 
    },
    { 
      brand: 'Jeep', 
      models: [
        { name: 'Wrangler', years: ['JL', 'JK', 'TJ'] },
        { name: 'Gladiator', years: ['JT'] },
        { name: 'Grand Cherokee', years: ['WK2', 'WJ'] }
      ] 
    },
    { 
      brand: 'Mitsubishi', 
      models: [
        { name: 'Triton', years: ['MR (2019+)', 'MQ (2015-2018)', 'MN/ML'] },
        { name: 'Pajero', years: ['NX/NW/NT (2007+)', 'NM/NP'] },
        { name: 'Pajero Sport', years: ['QE/QF (2015+)'] }
      ] 
    },
    { 
      brand: 'Holden/Isuzu', 
      models: [
        { name: 'D-MAX', years: ['RG (2020+)', 'RT (2012-2019)'] },
        { name: 'MU-X', years: ['RJ (2021+)', 'RF (2013-2020)'] },
        { name: 'Colorado', years: ['RG (2012-2020)', 'RC (2008-2012)'] }
      ] 
    },
    { 
      brand: 'Land Rover', 
      models: [
        { name: 'Defender', years: ['L663 (2020+)', 'Traditional (Pre-2016)'] },
        { name: 'Discovery', years: ['Discovery 4', 'Discovery 3'] }
      ] 
    },
    { 
      brand: 'Volkswagen', 
      models: [
        { name: 'Amarok', years: ['NF (2023+)', 'Original (2010-2022)'] }
      ] 
    }
  ];

  // Load database on mount
  useEffect(() => {
    // Check local storage for persistent cart
    const savedCart = localStorage.getItem('roco_cart');
    if (savedCart) {
       try { setCart(JSON.parse(savedCart)); } catch (e) {}
    }

    // Phase 12: Supabase Architecture - fetch from public cloud bucket to bypass Netlify limitations
    const bucketUrl = `https://ijtkbisxyoondehvcqza.supabase.co/storage/v1/object/public/roco-assets/master_database.json`;
    
    fetch(bucketUrl, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setDatabase(data);
      })
      .catch(err => {
        console.error("Error loading DB from Supabase:", err);
        setMessages(prev => [...prev, { sender: 'bot', text: 'Error: Could not load the master database from Cloud Storage. Ensure your bucket exists.' }]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Save cart changes to persistent local memory lock
  useEffect(() => {
     localStorage.setItem('roco_cart', JSON.stringify(cart));
  }, [cart]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'roco2026') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password. Try: roco2026');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSearch(inputValue);
  };

  const executeSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: queryText }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: queryText })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Error connecting to AI: ' + (data.error || 'Unknown error') }]);
        setIsLoading(false);
        return;
      }

      let replyText = data.reply || '';
      let displayResults: Product[] = [];

      // Extract parts from the AI's response text to populate the Middle Grid constraint
      const rawTags = replyText.match(/\[\[PART:(.*?)\]\]/g);
      if (rawTags) {
         const extractedCodes = rawTags.map((t: string) => t.replace(/\[\[PART:|\]\]/g, '').trim().toUpperCase());
         displayResults = database.filter(p => extractedCodes.includes(String(p['Unnamed: 0']).toUpperCase()));
      }

      setResults(displayResults);
      setMessages(prev => [...prev, { sender: 'bot', text: replyText }]);

    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Network sequence failed trying to reach the AI engine.' }]);
    }
    
    setIsLoading(false);
  };

  // Cart & Sorting Logic
  const addToCart = (item: Product) => {
    setCart(prev => [...prev, item]);
    setRightTab('cart'); // Auto-switch!
  };
  const removeFromCart = (index: number) => setCart(prev => prev.filter((_, i) => i !== index));
  const clearCart = () => setCart([]);
  
  const toggleSort = () => {
    if (sortOrder === 'none') setSortOrder('asc');
    else if (sortOrder === 'asc') setSortOrder('desc');
    else setSortOrder('none');
  };

  let sortedResults = [...results];
  if (sortOrder !== 'none') {
    sortedResults.sort((a, b) => {
      let pa = Number(a['Unnamed: 2']) || 0;
      let pb = Number(b['Unnamed: 2']) || 0;
      return sortOrder === 'asc' ? pa - pb : pb - pa;
    });
  }

  const formatPrice = (val: any) => {
    if (!val || val === 'None') return '-';
    if (typeof val === 'number') return '$' + val.toFixed(2);
    return val;
  };

  // Custom AI Catalogue Compiler
  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, lIdx) => {
      if (!line.trim()) return <br key={lIdx} />;
      
      const segments = line.split(/(\[\[PART:.*?\]\]|\*\*.*?\*\*)/g);
      
      const elements = segments.map((seg, sIdx) => {
        const partMatch = seg.match(/\[\[PART:(.*?)\]\]/);
        if (partMatch) {
          const code = partMatch[1].trim();
          const dbItem = database.find(p => String(p['Unnamed: 0']).toUpperCase() === code.toUpperCase());
          if (dbItem) {
            return (
              <span key={sIdx} className="part-tag" onClick={() => addToCart(dbItem)} title="Click to add to Estimate">
                {code} <span className="part-price">{formatPrice(dbItem['Unnamed: 2'])}</span>
              </span>
            );
          }
          return <span key={sIdx} className="part-tag not-found">{code}</span>;
        }

        const boldMatch = seg.match(/\*\*(.*?)\*\*/);
        if (boldMatch) return <strong key={sIdx} style={{color: '#fff'}}>{boldMatch[1]}</strong>;

        return seg;
      });

      if (line.startsWith('### ')) return <h4 key={lIdx} style={{color: '#ff5722', margin: '5px 0'}}>{elements.slice(1)}</h4>;
      if (line.startsWith('## ')) return <h3 key={lIdx} style={{color: '#ff5722', margin: '10px 0'}}>{elements.slice(1)}</h3>;
      if (line.startsWith('# ')) return <h2 key={lIdx} style={{color: '#fff', borderBottom: '1px solid #333'}}>{elements.slice(1)}</h2>;
      if (line.startsWith('* ') || line.startsWith('- ')) return <div key={lIdx} style={{marginLeft: '15px'}}>• {elements.slice(1)}</div>;

      return <div key={lIdx} className="message-line" style={{marginTop: '4px'}}>{elements}</div>;
    });
  };

  // File Upload Logic for Admin Dropdown
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Range 6 skips the first 6 rows, accurately matching the Python Pandas header indexing!
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, range: 6 });
        
        const formattedData = rows.map((r: any) => ({
          'Unnamed: 0': r[0] || 'None',  // Part code
          'Unnamed: 1': r[1] || 'None',  // Description
          'Unnamed: 2': r[2] || 'None'   // Price
        })).filter((r: any) => String(r['Unnamed: 0']) !== 'None' && String(r['Unnamed: 0']).trim() !== '');

        setMessages(prev => [...prev, { sender: 'bot', text: 'Admin Process: Beaming updated Excel JSON payload via Secure Handoff...' }]);
        
        const APIres = await fetch('/api/upload-database', {
            method: 'POST', body: JSON.stringify(formattedData)
        });
           
        if(APIres.ok) {
            setDatabase(formattedData);
            setMessages(prev => [...prev, { sender: 'bot', text: 'Cloud Admin: Success! New Master Catalogue securely encrypted to Supabase. Live for all users immediately!' }]);
            setInputValue('');
        } else {
            let errorTxt = APIres.statusText;
            try {
                const errorData = await APIres.json();
                if (errorData.error) errorTxt = errorData.error;
            } catch (e) {}
            throw new Error(`Server Rejected: ${APIres.status} HTTP Status -> ${errorTxt}`);
        }
      } catch(err) {
        console.error(err);
        setMessages(prev => [...prev, { sender: 'bot', text: 'System Error: ' + err }]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item['Unnamed: 2']) || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1 className="login-title">ROCO <span>4x4</span></h1>
          <p className="login-subtitle">Owner Secure Access</p>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Enter master password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-primary">AUTHENTICATE</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      
      {/* LEFT: Chat Section */}
      <section className="chat-section noprint">
        <div className="chat-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2>ROCO <span>Assistant</span></h2>
          {/* Admin Database Dropzone */}
          <div className="upload-btn-wrapper">
             <button className="upload-btn">Upload Excel .xlsx</button>
             <input type="file" name="myfile" accept=".xlsx" onChange={handleExcelUpload} />
          </div>
        </div>
        
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.sender}`}>
              {msg.sender === 'user' ? msg.text : renderMessageText(msg.text)}
            </div>
          ))}
          
          {/* Dynamic AI Thinking Indicator */}
          {isLoading && (
            <div className="message bot typing-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="typing-text">AI is cross-referencing your PDF Catalogue...</span>
            </div>
          )}
        </div>

        <form className="chat-input-area" onSubmit={handleSearch}>
          <input 
            type="text" 
            className="chat-input" 
            placeholder="Search parts..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="send-btn" disabled={isLoading}>
            &#10148;
          </button>
        </form>
      </section>

      {/* MIDDLE: Interactive Spreadsheet Grid */}
      <section className="data-section noprint">
        <div className="data-header">
          <h2>Inventory Grid</h2>
          <div className="stats">
            {isLoading ? 'Loading database...' : `Total Records: ${Array.isArray(database) ? database.length.toLocaleString() : 0}`}
          </div>
        </div>

        <div className="grid-container">
          {sortedResults.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>PART NUMBER</th>
                  <th>DESCRIPTION</th>
                  <th onClick={toggleSort} className="sortable-header">
                    RETAIL PRICE (AUD) {sortOrder === 'asc' ? '↑' : sortOrder === 'desc' ? '↓' : '↕'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((item, idx) => (
                  <tr key={idx} onClick={() => addToCart(item)} className="clickable-row" title="Click to add to Estimate">
                    <td className="col-part">{item['Unnamed: 0'] !== 'None' ? String(item['Unnamed: 0']) : '-'}</td>
                    <td>{item['Unnamed: 1'] !== 'None' ? item['Unnamed: 1'] : 'No Description'}</td>
                    <td className="col-price">{formatPrice(item['Unnamed: 2'])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              <span>Type in the chat to pull up spreadsheet data.</span>
            </div>
          )}
        </div>
      </section>

      {/* RIGHT: Tabbed Panel (Estimate Builder / Index) */}
      <section className="cart-section">
        <div className="cart-tabs noprint">
          <button className={`tab-btn ${rightTab === 'index' ? 'active' : ''}`} onClick={() => setRightTab('index')}>Catalogue Index</button>
          <button className={`tab-btn ${rightTab === 'cart' ? 'active' : ''}`} onClick={() => setRightTab('cart')}>Estimate Cart</button>
        </div>

        {rightTab === 'index' && (
          <div className="index-container">
            <h3 style={{color:'white', padding: '20px 20px 10px 20px', margin: 0}}>Supported Vehicles</h3>
            <div className="accordion-list">
              {vehicleIndex.map(v => (
                <div key={v.brand} className="accordion-item">
                  <div className="accordion-header" onClick={() => toggleBrand(v.brand)}>
                    <span>{v.brand}</span>
                    <span>{openBrand === v.brand ? '−' : '+'}</span>
                  </div>
                  {openBrand === v.brand && (
                    <div className="accordion-body">
                      {v.models.map((m, mIdx) => (
                         <div key={mIdx}>
                           <div className="accordion-row" onClick={() => m.years ? toggleModel(m.name) : executeSearch(`Provide a full structural parts list for the ${v.brand} ${m.name}`)}>
                             <span className="arrow">{m.years && openModel === m.name ? '▼' : '↳'}</span> {m.name}
                           </div>
                           {m.years && openModel === m.name && (
                             <div className="accordion-body" style={{ paddingLeft: '1.5rem', background: 'rgba(0,0,0,0.2)', borderLeft: '2px solid #2d2d2d' }}>
                               {m.years.map((y, yIdx) => (
                                 <div key={yIdx} className="accordion-row" onClick={() => executeSearch(`Provide a full structural parts list and suspension subsets for the ${v.brand} ${m.name} ${y} generation`)} style={{ fontSize: '0.85rem', color: '#90CAF9', padding: '8px 12px' }}>
                                   <span style={{opacity: 0.5}}>-</span> {y}
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
            <p className="index-hint">Click any vehicle model to instantly auto-search it in the chat!</p>
          </div>
        )}

        {rightTab === 'cart' && (
          <>
            <div className="cart-items">
              {cart.length === 0 ? (
                <p className="empty-cart">Click orange tags in chat or items in the grid to add them to your estimate.</p>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="cart-item">
                    <div className="cart-item-header">
                      <span className="cart-item-desc">{item['Unnamed: 1']}</span>
                      <button type="button" onClick={() => removeFromCart(idx)} className="del-btn">✕</button>
                    </div>
                    <span className="cart-item-price">{formatPrice(item['Unnamed: 2'])}</span>
                  </div>
                ))
              )}
            </div>
            <div className="cart-footer">
              <div className="noprint" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{color: 'white', opacity: 0.7, fontSize: '0.9rem'}}>Items: {cart.length}</span>
                <div style={{display: 'flex', gap: '8px'}}>
                  <button onClick={() => window.print()} className="del-btn" style={{border: '1px solid #1c2a1c', padding: '4px 10px', borderRadius: '4px', backgroundColor: '#0d1a0d', cursor: 'pointer', color: '#4caf50'}}>
                      Export PDF
                  </button>
                  {cart.length > 0 && (
                     <button onClick={clearCart} className="del-btn" style={{border: '1px solid #3d2319', padding: '4px 10px', borderRadius: '4px', backgroundColor: '#27140e', cursor: 'pointer'}}>
                        Clear All
                     </button>
                  )}
                </div>
              </div>
              <h3 className="cart-sum">Total Value: {formatPrice(cartTotal)}</h3>
            </div>
          </>
        )}
      </section>

    </div>
  );
}
