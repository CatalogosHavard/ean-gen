/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, Bell, Badge, FileUp, Zap, Info, Lightbulb,
  Download, Upload, Plus, ShieldCheck, Ban, CheckCircle2, XCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function TopNavBar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const tabs = [
    { id: 'generator', label: 'Generator' },
    { id: 'registry', label: 'Registry' },
    { id: 'validator', label: 'Validator' },
    { id: 'blacklist', label: 'Blacklist' },
    { id: 'settings', label: 'Data & Settings' }
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-[0_4px_12px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,88,188,0.08)]">
      <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-full mx-auto">
        <div className="flex items-center gap-4 md:gap-8 overflow-x-auto no-scrollbar">
          <span className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white font-headline shrink-0">EAN Flow</span>
          <div className="flex gap-4 md:gap-6 items-center">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "font-headline text-sm font-semibold tracking-tight transition-colors duration-300 pb-1 whitespace-nowrap",
                  activeTab === tab.id ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400" : "text-slate-500 dark:text-slate-400 hover:text-blue-500"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
            <Bell className="text-on-surface-variant w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30">
            <img 
              alt="User Profile" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCm6uN3moYV5uZa9SzeY9TebBj_J4X4NoYg37BnFvs21yTH2unD4Pm8exysYcMZ_N16B4UHdF4aEmdljRQ3pnqq2gvwB3o_X7RpUh6iVnbPOrKoUTVJDVunEeJ7rSYl-UDG96T8qtxXOrfJ_PYBlqTo_InujivYXXDcLBW4ZuYcmFWzYS1fODk5pFlh5GxrIN39OK00rBuATdtGzEr-WpA3iet7FMTL3_2VqEYcU_qG3OT2TNhOSdp48WrQHat1i2JFolFcYaaTP4d"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 w-full py-12 border-t border-slate-200/15 mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center px-12 max-w-7xl mx-auto gap-8">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="font-bold text-slate-900 dark:text-white font-headline">EAN Flow</span>
          <p className="font-body text-slate-500 dark:text-slate-400 text-sm">© 2026 EAN Flow. Atmospheric Clarity Design.</p>
        </div>
      </div>
    </footer>
  );
}

type Brand = { id: number; name: string; prefix: string };
type EAN = { ean: string; brand_id: number; status: string };

export default function App() {
  const [activeTab, setActiveTab] = useState('generator');
  
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandPrefix, setNewBrandPrefix] = useState('');
  
  const [eans, setEans] = useState<EAN[]>([]);
  const [generateCount, setGenerateCount] = useState(10);
  
  const [validateEan, setValidateEan] = useState('');
  const [blacklistInput, setBlacklistInput] = useState('');

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedBrands = localStorage.getItem('eanflow_brands');
    const savedEans = localStorage.getItem('eanflow_eans');
    
    if (savedBrands) {
      const parsedBrands = JSON.parse(savedBrands);
      setBrands(parsedBrands);
      if (parsedBrands.length > 0) setSelectedBrandId(parsedBrands[0].id);
    }
    if (savedEans) {
      setEans(JSON.parse(savedEans));
    }
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('eanflow_brands', JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    localStorage.setItem('eanflow_eans', JSON.stringify(eans));
  }, [eans]);

  const calcChecksum = (code12: string) => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code12[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const rem = sum % 10;
    return rem === 0 ? 0 : 10 - rem;
  };

  const handleCreateBrand = () => {
    if (!newBrandName || !newBrandPrefix) return;
    if (brands.some(b => b.prefix === newBrandPrefix)) {
      alert('Brand prefix already exists.');
      return;
    }
    const newBrand = {
      id: Date.now(),
      name: newBrandName,
      prefix: newBrandPrefix
    };
    setBrands([...brands, newBrand]);
    setSelectedBrandId(newBrand.id);
    setNewBrandName('');
    setNewBrandPrefix('');
  };

  const handleGenerate = () => {
    if (!selectedBrandId) return;
    const brand = brands.find(b => b.id === selectedBrandId);
    if (!brand) return;

    const prefix = brand.prefix;
    const prefixLen = prefix.length;
    const itemRefLen = 12 - prefixLen;
    const maxItems = Math.pow(10, itemRefLen);

    const existingEansForBrand = eans.filter(e => e.brand_id === selectedBrandId);
    const existingSet = new Set(eans.map(e => e.ean));

    const generated: EAN[] = [];
    let startRef = 0;
    
    if (existingEansForBrand.length > 0) {
       const refs = existingEansForBrand.map(e => parseInt(e.ean.substring(prefixLen, 12)));
       startRef = Math.max(...refs) + 1;
    }

    for (let i = startRef; i < maxItems && generated.length < generateCount; i++) {
       const itemRefStr = i.toString().padStart(itemRefLen, '0');
       const code12 = prefix + itemRefStr;
       const checksum = calcChecksum(code12);
       const ean13 = code12 + checksum;

       if (!existingSet.has(ean13)) {
         generated.push({ ean: ean13, brand_id: selectedBrandId, status: 'generated' });
         existingSet.add(ean13);
       }
    }

    setEans([...eans, ...generated]);
  };

  const changeEanStatus = (eanStr: string, newStatus: string) => {
    setEans(prev => {
      const index = prev.findIndex(e => e.ean === eanStr);
      if (index >= 0) {
        const next = [...prev];
        next[index].status = newStatus;
        return next;
      }
      return prev;
    });
  };

  const handleAddToBlacklist = () => {
    if (!blacklistInput) return;
    const eanList = blacklistInput.split('\n').map(e => e.trim()).filter(e => e.length > 0);
    if (eanList.length === 0) return alert('No EANs provided');
    
    const newEans = [...eans];
    let addedCount = 0;
    let updatedCount = 0;
    let invalidCount = 0;

    for (const eanStr of eanList) {
      if (!/^\d{13}$/.test(eanStr)) {
        invalidCount++;
        continue;
      }
      
      const code12 = eanStr.substring(0, 12);
      const expectedChecksum = calcChecksum(code12);
      if (expectedChecksum !== parseInt(eanStr[12])) {
        invalidCount++;
        continue;
      }

      const existingIndex = newEans.findIndex(e => e.ean === eanStr);
      if (existingIndex >= 0) {
        if (newEans[existingIndex].status !== 'blacklisted') {
          newEans[existingIndex].status = 'blacklisted';
          updatedCount++;
        }
      } else {
        const prefix7 = eanStr.substring(0, 7);
        const prefix8 = eanStr.substring(0, 8);
        const prefix9 = eanStr.substring(0, 9);
        const brand = brands.find(b => b.prefix === prefix7 || b.prefix === prefix8 || b.prefix === prefix9);
        
        newEans.push({
          ean: eanStr,
          brand_id: brand ? brand.id : 0,
          status: 'blacklisted'
        });
        addedCount++;
      }
    }

    setEans(newEans);
    setBlacklistInput('');
    
    let alertMsg = `Blacklist updated.\nAdded: ${addedCount}\nUpdated: ${updatedCount}`;
    if (invalidCount > 0) {
      alertMsg += `\nMathematically Invalid (Ignored): ${invalidCount}`;
    }
    alert(alertMsg);
  };

  const handleExport = () => {
    const data = { brands, eans };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eanflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.brands && data.eans) {
          setBrands(data.brands);
          setEans(data.eans);
          if (data.brands.length > 0) setSelectedBrandId(data.brands[0].id);
          alert('Data imported successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Error parsing file.');
      }
    };
    reader.readAsText(file);
  };

  const selectedBrand = brands.find(b => b.id === selectedBrandId);
  const currentBrandEans = selectedBrandId ? eans.filter(e => e.brand_id === selectedBrandId) : eans;
  const availableCount = currentBrandEans.filter(e => e.status === 'generated').length;
  const usedCount = currentBrandEans.filter(e => e.status === 'used').length;
  const blacklistedCount = currentBrandEans.filter(e => e.status === 'blacklisted').length;

  const validationResult = React.useMemo(() => {
    if (!validateEan) return null;
    if (!/^\d{13}$/.test(validateEan)) return { valid: false, msg: 'EAN must be exactly 13 digits.' };
    
    const checksum = calcChecksum(validateEan.substring(0, 12));
    if (checksum !== parseInt(validateEan[12])) {
      return { valid: false, msg: `Invalid checksum. Expected ${checksum}, got ${validateEan[12]}.` };
    }
    
    const existing = eans.find(e => e.ean === validateEan);
    if (existing) {
      const brand = brands.find(b => b.id === existing.brand_id);
      return { 
        valid: true, 
        msg: 'Mathematically Valid', 
        status: existing.status, 
        brand: brand?.name || 'Unknown' 
      };
    }
    return { valid: true, msg: 'Mathematically Valid', status: 'unregistered', brand: '-' };
  }, [validateEan, eans, brands]);

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed font-body flex flex-col">
      <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto w-full flex-1">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
            {activeTab === 'generator' && 'EAN Generator'}
            {activeTab === 'registry' && 'EAN Registry'}
            {activeTab === 'validator' && 'EAN Validator'}
            {activeTab === 'blacklist' && 'Blacklist'}
            {activeTab === 'settings' && 'Data & Settings'}
          </h1>
          <p className="text-on-surface-variant text-lg">
            {activeTab === 'generator' && 'Define your brand identity and generate unique product identifiers at scale.'}
            {activeTab === 'registry' && 'Manage your generated, used, and blacklisted EANs.'}
            {activeTab === 'validator' && 'Mathematically verify any EAN-13 and check its status in your registry.'}
            {activeTab === 'blacklist' && 'Prevent specific EANs from being generated by adding them to the blacklist.'}
            {activeTab === 'settings' && 'Manage your local database, export backups, and import data.'}
          </p>
        </motion.header>

        {activeTab === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-7 space-y-8"
            >
              <div className="bg-surface-container-lowest/70 glass-effect p-10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,88,188,0.08)]">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                      <Badge className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-on-surface font-headline">Brand Identity</h2>
                      <p className="text-sm text-on-surface-variant">Select or create a brand</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {brands.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-on-surface-variant ml-1">Select Brand</label>
                      <select 
                        className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-medium outline-none"
                        value={selectedBrandId || ''}
                        onChange={(e) => setSelectedBrandId(Number(e.target.value))}
                      >
                        {brands.map(b => (
                          <option key={b.id} value={b.id}>{b.name} (Prefix: {b.prefix})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="pt-4 border-t border-outline-variant/20">
                    <p className="text-sm font-bold text-on-surface mb-4">Or Create New Brand</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input 
                        className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-medium placeholder:text-outline/50 outline-none" 
                        placeholder="Brand Name" 
                        value={newBrandName}
                        onChange={e => setNewBrandName(e.target.value)}
                        type="text"
                      />
                      <input 
                        className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-medium placeholder:text-outline/50 outline-none" 
                        placeholder="Prefix (7-9 digits)" 
                        value={newBrandPrefix}
                        onChange={e => setNewBrandPrefix(e.target.value)}
                        type="number"
                      />
                    </div>
                    <button 
                      onClick={handleCreateBrand}
                      className="mt-4 py-3 px-6 bg-surface-container-high text-on-surface font-bold rounded-lg hover:bg-surface-dim transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Brand
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div className="flex-1 flex gap-4">
                  <input 
                    type="number" 
                    value={generateCount}
                    onChange={e => setGenerateCount(Number(e.target.value))}
                    className="w-32 bg-surface-container-low border-none rounded-xl p-5 text-center font-bold text-lg outline-none focus:ring-2 focus:ring-primary/20"
                    min="1"
                    max="1000"
                  />
                  <button 
                    onClick={handleGenerate}
                    disabled={!selectedBrandId}
                    className="flex-1 py-5 px-8 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Zap className="w-6 h-6 fill-current" />
                    Generate {generateCount} EANs
                  </button>
                </div>
              </div>
            </motion.section>

            <motion.aside 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-5 space-y-8"
            >
              <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl overflow-hidden shadow-xl">
                <div className="p-6 bg-surface-container-low/50 flex justify-between items-center border-b border-outline-variant/10">
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Live Preview</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-error"></div>
                    <div className="w-2 h-2 rounded-full bg-secondary-container"></div>
                    <div className="w-2 h-2 rounded-full bg-primary-fixed-dim"></div>
                  </div>
                </div>
                <div className="p-10 flex flex-col items-center">
                  <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-100 mb-8 w-full">
                    <div className="h-32 w-full flex items-end gap-[2px] mb-4 overflow-hidden">
                      <div className="h-full w-1 bg-black"></div>
                      <div className="h-full w-[2px] bg-black"></div>
                      <div className="h-[90%] w-1 bg-black"></div>
                      <div className="h-[90%] w-[3px] bg-black"></div>
                      <div className="h-[90%] w-1 bg-black"></div>
                      <div className="h-[90%] w-[2px] bg-black"></div>
                      <div className="h-full w-1 bg-black"></div>
                      <div className="h-full w-[2px] bg-black"></div>
                      <div className="h-[90%] w-2 bg-black"></div>
                      <div className="h-[90%] w-[1px] bg-black"></div>
                      <div className="h-[90%] w-3 bg-black"></div>
                      <div className="h-[90%] w-1 bg-black"></div>
                      <div className="h-[90%] w-2 bg-black"></div>
                      <div className="h-[90%] w-[1px] bg-black"></div>
                      <div className="h-full w-1 bg-black"></div>
                      <div className="h-full w-[3px] bg-black"></div>
                      <div className="h-[90%] w-1 bg-black"></div>
                      <div className="h-[90%] w-[2px] bg-black"></div>
                      <div className="h-[90%] w-2 bg-black"></div>
                      <div className="h-[90%] w-[1px] bg-black"></div>
                      <div className="h-full w-1 bg-black"></div>
                      <div className="h-full w-[2px] bg-black"></div>
                    </div>
                    <div className="flex justify-between font-mono text-2xl font-bold tracking-[0.5em] text-black">
                      {selectedBrand ? (
                        <>
                          <span>{selectedBrand.prefix[0]}</span>
                          <span>{selectedBrand.prefix.substring(1)}</span>
                          <span>0000</span>
                          <span>X</span>
                        </>
                      ) : (
                        <>
                          <span>7</span>
                          <span>751234</span>
                          <span>56789</span>
                          <span>0</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="w-full space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant">Structure</span>
                      <span className="font-semibold text-on-surface">EAN-13 Standard</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant">Checksum Digit</span>
                      <span className="font-semibold text-primary">Valid (Modulo 10)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Available</p>
                  <p className="text-2xl font-extrabold text-primary">{availableCount.toLocaleString()}</p>
                </div>
                <div className="bg-secondary/5 p-4 rounded-xl border border-secondary/10">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Used</p>
                  <p className="text-2xl font-extrabold text-secondary">{usedCount.toLocaleString()}</p>
                </div>
                <div className="bg-error/5 p-4 rounded-xl border border-error/10">
                  <p className="text-[10px] font-bold text-error uppercase tracking-wider mb-1">Blacklist</p>
                  <p className="text-2xl font-extrabold text-error">{blacklistedCount.toLocaleString()}</p>
                </div>
              </div>
            </motion.aside>
          </div>
        )}

        {activeTab === 'registry' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden"
          >
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/30">
              <h2 className="text-xl font-bold font-headline">Generated EANs</h2>
              <div className="flex gap-4 items-center">
                <select 
                  className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-2 outline-none text-sm font-medium"
                  value={selectedBrandId || ''}
                  onChange={(e) => setSelectedBrandId(Number(e.target.value))}
                >
                  <option value="">All Brands</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-low/50 text-on-surface-variant font-semibold">
                  <tr>
                    <th className="p-4">EAN-13</th>
                    <th className="p-4">Brand</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {currentBrandEans.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-on-surface-variant">
                        No EANs found for this selection.
                      </td>
                    </tr>
                  ) : (
                    currentBrandEans.map((ean) => {
                      const brand = brands.find(b => b.id === ean.brand_id);
                      return (
                        <tr key={ean.ean} className="hover:bg-surface-container-lowest/50 transition-colors">
                          <td className="p-4 font-mono font-medium">{ean.ean}</td>
                          <td className="p-4">{brand?.name || 'Unknown'}</td>
                          <td className="p-4">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                              ean.status === 'generated' ? "bg-primary/10 text-primary" :
                              ean.status === 'used' ? "bg-secondary/10 text-secondary" :
                              "bg-error/10 text-error"
                            )}>
                              {ean.status}
                            </span>
                          </td>
                          <td className="p-4 text-right flex justify-end gap-4">
                            {ean.status !== 'used' && ean.status !== 'blacklisted' && (
                              <button 
                                onClick={() => changeEanStatus(ean.ean, 'used')}
                                className="text-xs font-bold text-primary hover:underline cursor-pointer"
                              >
                                Mark Used
                              </button>
                            )}
                            {ean.status !== 'blacklisted' && (
                              <button 
                                onClick={() => changeEanStatus(ean.ean, 'blacklisted')}
                                className="text-xs font-bold text-error hover:underline cursor-pointer"
                              >
                                Blacklist
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'validator' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold font-headline mb-4">Mathematical EAN Validator</h2>
              <p className="text-on-surface-variant mb-8">
                Enter any 13-digit EAN code. The system will mathematically verify its checksum and check if it exists in your local registry or blacklist.
              </p>
              
              <input 
                type="text" 
                value={validateEan}
                onChange={e => setValidateEan(e.target.value.replace(/\D/g, '').slice(0, 13))}
                placeholder="Enter 13 digits..."
                className="w-full max-w-md mx-auto bg-surface-container-low border-none rounded-xl p-5 text-center font-mono text-2xl tracking-widest outline-none focus:ring-2 focus:ring-primary/20 mb-8"
              />

              {validationResult && (
                <div className={cn(
                  "p-6 rounded-xl border text-left max-w-md mx-auto",
                  validationResult.valid ? "bg-primary/5 border-primary/20" : "bg-error/5 border-error/20"
                )}>
                  <div className="flex items-start gap-4">
                    {validationResult.valid ? (
                      <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
                    ) : (
                      <XCircle className="w-6 h-6 text-error shrink-0 mt-1" />
                    )}
                    <div>
                      <h3 className={cn("font-bold text-lg mb-1", validationResult.valid ? "text-primary" : "text-error")}>
                        {validationResult.msg}
                      </h3>
                      {validationResult.valid && (
                        <div className="space-y-2 mt-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Registry Status:</span>
                            <span className="font-bold uppercase">{validationResult.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Brand Match:</span>
                            <span className="font-bold">{validationResult.brand}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'blacklist' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center text-error">
                    <Ban className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold font-headline">Manual Blacklist Load</h2>
                </div>
                <p className="text-sm text-on-surface-variant mb-4">
                  Paste EANs (one per line) to prevent them from being generated. They will be mathematically validated before insertion.
                </p>
                <textarea 
                  className="w-full h-48 bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-error/20 transition-all text-on-surface font-mono text-sm outline-none resize-none mb-4"
                  placeholder="Paste EANs here..."
                  value={blacklistInput}
                  onChange={e => setBlacklistInput(e.target.value)}
                />
                <button 
                  onClick={handleAddToBlacklist}
                  className="w-full py-3 px-6 bg-error text-white font-bold rounded-lg hover:bg-error/90 transition-colors cursor-pointer"
                >
                  Add to Blacklist
                </button>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden h-full flex flex-col">
                <div className="p-6 border-b border-outline-variant/20 bg-surface-container-low/30">
                  <h2 className="text-xl font-bold font-headline">Blacklisted EANs</h2>
                </div>
                <div className="overflow-y-auto flex-1 p-0">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-container-low/50 text-on-surface-variant font-semibold sticky top-0">
                      <tr>
                        <th className="p-4">EAN-13</th>
                        <th className="p-4">Brand</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {eans.filter(e => e.status === 'blacklisted').length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-on-surface-variant">
                            No EANs in the blacklist.
                          </td>
                        </tr>
                      ) : (
                        eans.filter(e => e.status === 'blacklisted').map((ean) => {
                          const brand = brands.find(b => b.id === ean.brand_id);
                          return (
                            <tr key={ean.ean} className="hover:bg-surface-container-lowest/50 transition-colors">
                              <td className="p-4 font-mono font-medium">{ean.ean}</td>
                              <td className="p-4">{brand?.name || 'Unknown'}</td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => changeEanStatus(ean.ean, 'generated')}
                                  className="text-xs font-bold text-on-surface-variant hover:text-primary hover:underline cursor-pointer"
                                >
                                  Remove (Set Generated)
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-8">
              <div className="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center text-primary mb-6">
                <Download className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold font-headline mb-2">Export Database</h2>
              <p className="text-on-surface-variant text-sm mb-6">
                Download a JSON file containing all your brands and generated EANs. Keep this file safe as a backup.
              </p>
              <button 
                onClick={handleExport}
                className="w-full py-3 px-6 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-5 h-5" /> Export Data
              </button>
            </div>

            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-8">
              <div className="w-12 h-12 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary mb-6">
                <Upload className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold font-headline mb-2">Import Database</h2>
              <p className="text-on-surface-variant text-sm mb-6">
                Restore your database from a previously exported JSON file. This will overwrite your current data.
              </p>
              <label className="w-full py-3 px-6 bg-surface-container-high text-on-surface font-bold rounded-lg hover:bg-surface-dim transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-5 h-5" /> 
                <span>Select JSON File</span>
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={handleImport}
                />
              </label>
            </div>
          </motion.div>
        )}

      </main>
      <Footer />
    </div>
  );
}
