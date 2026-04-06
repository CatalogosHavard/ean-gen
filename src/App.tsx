import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, Bell, Badge, FileUp, Zap, Info, Lightbulb,
  Download, Upload, Plus, ShieldCheck, Ban, CheckCircle2, XCircle, LogOut, User as UserIcon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocFromServer } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, userName?: string) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: userName || 'anonymous',
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  alert(`Error de Base de Datos: ${errInfo.error}`);
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function TopNavBar({ activeTab, setActiveTab, userName, onLogout }: { activeTab: string, setActiveTab: (t: string) => void, userName: string, onLogout: () => void }) {
  const tabs = [
    { id: 'generator', label: 'Generador' },
    { id: 'registry', label: 'Registro' },
    { id: 'validator', label: 'Validador' },
    { id: 'used_eans', label: 'Ya Usados' }
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-[0_4px_12px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,88,188,0.08)]">
      <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-full mx-auto">
        <div className="flex items-center gap-4 md:gap-8 overflow-x-auto no-scrollbar">
          <span className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white font-headline shrink-0">ColucciEANtool</span>
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
          {userName && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/30">
                <UserIcon className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{userName}</span>
              </div>
              <button onClick={onLogout} className="text-xs font-bold text-on-surface-variant hover:text-error transition-colors cursor-pointer">
                Cambiar Nombre
              </button>
            </div>
          )}
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
          <span className="font-bold text-slate-900 dark:text-white font-headline">ColucciEANtool</span>
          <p className="font-body text-slate-500 dark:text-slate-400 text-sm">© 2026 ColucciEANtool. Atmospheric Clarity Design.</p>
        </div>
      </div>
    </footer>
  );
}

type Brand = { id: number; name: string; prefix: string; createdBy?: string };
type EAN = { ean: string; brand_id: number; status: string; updatedBy?: string };

export default function App() {
  const [userName, setUserName] = useState<string>('');
  const [nameInput, setNameInput] = useState('');
  const [isReady, setIsReady] = useState(false);

  const [activeTab, setActiveTab] = useState('generator');
  
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandPrefix, setNewBrandPrefix] = useState('');
  
  const [eans, setEans] = useState<EAN[]>([]);
  const [generateCount, setGenerateCount] = useState(10);
  
  const [validateEan, setValidateEan] = useState('');
  const [bulkUsedInput, setBulkUsedInput] = useState('');
  const [modalMessage, setModalMessage] = useState<{title: string, body: string} | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem('ean_flow_username');
    if (storedName) {
      setUserName(storedName);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    if (!userName) return;

    const unsubscribeBrands = onSnapshot(collection(db, 'brands'), (snapshot) => {
      const loadedBrands: Brand[] = [];
      snapshot.forEach(doc => {
        loadedBrands.push(doc.data() as Brand);
      });
      setBrands(loadedBrands);
      if (loadedBrands.length > 0 && !selectedBrandId) {
        setSelectedBrandId(loadedBrands[0].id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'brands', userName);
    });

    const unsubscribeEans = onSnapshot(collection(db, 'eans'), (snapshot) => {
      const loadedEans: EAN[] = [];
      snapshot.forEach(doc => {
        loadedEans.push(doc.data() as EAN);
      });
      setEans(loadedEans);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'eans', userName);
    });

    return () => {
      unsubscribeBrands();
      unsubscribeEans();
    };
  }, [userName]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (trimmed) {
      localStorage.setItem('ean_flow_username', trimmed);
      setUserName(trimmed);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ean_flow_username');
    setUserName('');
    setNameInput('');
  };

  const calcChecksum = (code12: string) => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code12[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const rem = sum % 10;
    return rem === 0 ? 0 : 10 - rem;
  };

  const handleCreateBrand = async () => {
    if (!newBrandName || !newBrandPrefix) return;
    if (brands.some(b => b.prefix === newBrandPrefix)) {
      setModalMessage({ title: 'Error', body: 'El prefijo de la marca ya existe.' });
      return;
    }
    
    const newBrand: Brand = {
      id: Date.now(),
      name: newBrandName,
      prefix: newBrandPrefix,
      createdBy: userName
    };

    try {
      await setDoc(doc(db, 'brands', newBrand.id.toString()), newBrand);
      setSelectedBrandId(newBrand.id);
      setNewBrandName('');
      setNewBrandPrefix('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `brands/${newBrand.id}`, userName);
    }
  };

  const handleGenerate = async () => {
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
         generated.push({ ean: ean13, brand_id: selectedBrandId, status: 'generated', updatedBy: userName });
         existingSet.add(ean13);
       }
    }

    if (generated.length === 0) return;

    try {
      const batch = writeBatch(db);
      generated.forEach(eanObj => {
        const docRef = doc(db, 'eans', eanObj.ean);
        batch.set(docRef, eanObj);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'eans (batch)', userName);
    }
  };

  const changeEanStatus = async (eanStr: string, newStatus: string) => {
    const existingEan = eans.find(e => e.ean === eanStr);
    if (!existingEan) return;

    try {
      await setDoc(doc(db, 'eans', eanStr), {
        ...existingEan,
        status: newStatus,
        updatedBy: userName
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `eans/${eanStr}`, userName);
    }
  };

  const handleDeleteEan = async (eanStr: string) => {
    try {
      await deleteDoc(doc(db, 'eans', eanStr));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `eans/${eanStr}`, userName);
    }
  };

  const handleMarkAsUsedBulk = async () => {
    if (!bulkUsedInput) return;
    const eanList = bulkUsedInput.split('\n').map(e => e.trim()).filter(e => e.length > 0);
    if (eanList.length === 0) {
      setModalMessage({ title: 'Aviso', body: 'No se proporcionaron EANs' });
      return;
    }
    
    let addedCount = 0;
    let updatedCount = 0;
    let invalidCount = 0;

    const batch = writeBatch(db);

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

      const existingEan = eans.find(e => e.ean === eanStr);
      if (existingEan) {
        if (existingEan.status !== 'used') {
          batch.set(doc(db, 'eans', eanStr), {
            ...existingEan,
            status: 'used',
            updatedBy: userName
          });
          updatedCount++;
        }
      } else {
        const prefix7 = eanStr.substring(0, 7);
        const prefix8 = eanStr.substring(0, 8);
        const prefix9 = eanStr.substring(0, 9);
        const brand = brands.find(b => b.prefix === prefix7 || b.prefix === prefix8 || b.prefix === prefix9);
        
        batch.set(doc(db, 'eans', eanStr), {
          ean: eanStr,
          brand_id: brand ? brand.id : 0,
          status: 'used',
          updatedBy: userName
        });
        addedCount++;
      }
    }

    try {
      if (addedCount > 0 || updatedCount > 0) {
        await batch.commit();
      }
      setBulkUsedInput('');
      
      let alertMsg = `EANs marcados como usados.\nAgregados: ${addedCount}\nActualizados: ${updatedCount}`;
      if (invalidCount > 0) {
        alertMsg += `\nMatemáticamente Inválidos (Ignorados): ${invalidCount}`;
      }
      setModalMessage({ title: 'Carga Exitosa', body: alertMsg });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'eans (batch used)', userName);
    }
  };

  const selectedBrand = brands.find(b => b.id === selectedBrandId);
  const currentBrandEans = selectedBrandId ? eans.filter(e => e.brand_id === selectedBrandId) : eans;
  const availableCount = currentBrandEans.filter(e => e.status === 'generated').length;
  const usedCount = currentBrandEans.filter(e => e.status === 'used').length;

  const validationResult = React.useMemo(() => {
    if (!validateEan) return null;
    if (!/^\d{13}$/.test(validateEan)) return { valid: false, msg: 'El EAN debe tener exactamente 13 dígitos.' };
    
    const checksum = calcChecksum(validateEan.substring(0, 12));
    if (checksum !== parseInt(validateEan[12])) {
      return { valid: false, msg: `Dígito verificador inválido. Se esperaba ${checksum}, se obtuvo ${validateEan[12]}.` };
    }
    
    const existing = eans.find(e => e.ean === validateEan);
    if (existing) {
      const brand = brands.find(b => b.id === existing.brand_id);
      return { 
        valid: true, 
        msg: 'Matemáticamente Válido', 
        status: existing.status === 'generated' ? 'generado' : 'ya usado', 
        brand: brand?.name || 'Desconocido' 
      };
    }
    return { valid: true, msg: 'Matemáticamente Válido', status: 'no registrado', brand: '-' };
  }, [validateEan, eans, brands]);

  if (!isReady) {
    return <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed font-body flex flex-col">
      <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} userName={userName} onLogout={handleLogout} />
      
      <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto w-full flex-1">
        {!userName ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <UserIcon className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-extrabold font-headline mb-4">Bienvenido a ColucciEANtool</h1>
            <p className="text-xl text-on-surface-variant max-w-lg mb-8">
              Ingresa tu nombre para empezar a generar y gestionar EANs. Esto ayuda al equipo a saber quién creó qué.
            </p>
            <form onSubmit={handleSaveName} className="flex flex-col gap-4 w-full max-w-sm">
              <input 
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="Tu Nombre (ej. Juan)"
                className="w-full bg-surface-container-low border-none rounded-xl p-4 text-center font-bold text-lg outline-none focus:ring-2 focus:ring-primary/20"
                required
                maxLength={50}
              />
              <button 
                type="submit"
                className="py-4 px-8 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 hover:-translate-y-1 cursor-pointer"
              >
                Continuar
              </button>
            </form>
          </div>
        ) : (
          <>
            <motion.header 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <h1 className="text-5xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
                {activeTab === 'generator' && 'Generador de EANs'}
                {activeTab === 'registry' && 'Registro de EANs'}
                {activeTab === 'validator' && 'Validador de EANs'}
                {activeTab === 'used_eans' && 'Ya Usados'}
              </h1>
              <p className="text-on-surface-variant text-lg">
                {activeTab === 'generator' && 'Define la identidad de tu marca y genera identificadores de producto únicos a escala.'}
                {activeTab === 'registry' && 'Gestiona tus EANs generados y ya usados.'}
                {activeTab === 'validator' && 'Verifica matemáticamente cualquier EAN-13 y revisa su estado en tu registro.'}
                {activeTab === 'used_eans' && 'Carga manualmente EANs que ya han sido utilizados para evitar que se vuelvan a generar.'}
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
                          <h2 className="text-xl font-bold text-on-surface font-headline">Identidad de Marca</h2>
                          <p className="text-sm text-on-surface-variant">Selecciona o crea una marca</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {brands.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-on-surface-variant ml-1">Seleccionar Marca</label>
                          <select 
                            className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-medium outline-none"
                            value={selectedBrandId || ''}
                            onChange={(e) => setSelectedBrandId(Number(e.target.value))}
                          >
                            {brands.map(b => (
                              <option key={b.id} value={b.id}>{b.name} (Prefijo: {b.prefix})</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="pt-4 border-t border-outline-variant/20">
                        <p className="text-sm font-bold text-on-surface mb-4">O Crear Nueva Marca</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input 
                            className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-medium placeholder:text-outline/50 outline-none" 
                            placeholder="Nombre de la Marca" 
                            value={newBrandName}
                            onChange={e => setNewBrandName(e.target.value)}
                            type="text"
                          />
                          <input 
                            className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-medium placeholder:text-outline/50 outline-none" 
                            placeholder="Prefijo (7-9 dígitos)" 
                            value={newBrandPrefix}
                            onChange={e => setNewBrandPrefix(e.target.value)}
                            type="number"
                          />
                        </div>
                        <button 
                          onClick={handleCreateBrand}
                          className="mt-4 py-3 px-6 bg-surface-container-high text-on-surface font-bold rounded-lg hover:bg-surface-dim transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Agregar Marca
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
                        Generar {generateCount} EANs
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
                      <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Vista Previa</span>
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
                          <span className="text-on-surface-variant">Estructura</span>
                          <span className="font-semibold text-on-surface">Estándar EAN-13</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-on-surface-variant">Dígito Verificador</span>
                          <span className="font-semibold text-primary">Válido (Módulo 10)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Disponibles</p>
                      <p className="text-2xl font-extrabold text-primary">{availableCount.toLocaleString()}</p>
                    </div>
                    <div className="bg-secondary/5 p-4 rounded-xl border border-secondary/10">
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Ya Usados</p>
                      <p className="text-2xl font-extrabold text-secondary">{usedCount.toLocaleString()}</p>
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
                  <h2 className="text-xl font-bold font-headline">EANs Generados</h2>
                  <div className="flex gap-4 items-center">
                    <select 
                      className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-2 outline-none text-sm font-medium"
                      value={selectedBrandId || ''}
                      onChange={(e) => setSelectedBrandId(Number(e.target.value))}
                    >
                      <option value="">Todas las Marcas</option>
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
                        <th className="p-4">Marca</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4">Agregado Por</th>
                        <th className="p-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {currentBrandEans.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                            No se encontraron EANs para esta selección.
                          </td>
                        </tr>
                      ) : (
                        currentBrandEans.map((ean) => {
                          const brand = brands.find(b => b.id === ean.brand_id);
                          return (
                            <tr key={ean.ean} className="hover:bg-surface-container-lowest/50 transition-colors">
                              <td className="p-4 font-mono font-medium">{ean.ean}</td>
                              <td className="p-4">{brand?.name || 'Desconocido'}</td>
                              <td className="p-4">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                  ean.status === 'generated' ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                                )}>
                                  {ean.status === 'generated' ? "Generado" : "Ya Usado"}
                                </span>
                              </td>
                              <td className="p-4 text-on-surface-variant">{ean.updatedBy || 'Desconocido'}</td>
                              <td className="p-4 text-right flex justify-end gap-4">
                                {ean.status === 'generated' && (
                                  <button 
                                    onClick={() => changeEanStatus(ean.ean, 'used')}
                                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                                  >
                                    Marcar Ya Usado
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleDeleteEan(ean.ean)}
                                  className="text-xs font-bold text-error hover:underline cursor-pointer"
                                >
                                  Eliminar
                                </button>
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
                  <h2 className="text-2xl font-bold font-headline mb-4">Validador Matemático de EAN</h2>
                  <p className="text-on-surface-variant mb-8">
                    Ingresa cualquier código EAN de 13 dígitos. El sistema verificará matemáticamente su dígito verificador y revisará si existe en tu registro o lista negra.
                  </p>
                  
                  <input 
                    type="text" 
                    value={validateEan}
                    onChange={e => setValidateEan(e.target.value.replace(/\D/g, '').slice(0, 13))}
                    placeholder="Ingresa 13 dígitos..."
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
                                <span className="text-on-surface-variant">Estado en Registro:</span>
                                <span className="font-bold uppercase">{validationResult.status}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-on-surface-variant">Marca Coincidente:</span>
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

            {activeTab === 'used_eans' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold font-headline">Carga Manual a Ya Usados</h2>
                    </div>
                    <p className="text-sm text-on-surface-variant mb-4">
                      Pega los EANs (uno por línea) para marcarlos como "Ya Usados" y evitar que sean generados.
                    </p>
                    <textarea 
                      className="w-full h-48 bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-secondary/20 transition-all text-on-surface font-mono text-sm outline-none resize-none mb-4"
                      placeholder="Pega los EANs aquí..."
                      value={bulkUsedInput}
                      onChange={e => setBulkUsedInput(e.target.value)}
                    />
                    <button 
                      onClick={handleMarkAsUsedBulk}
                      className="w-full py-3 px-6 bg-secondary text-white font-bold rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer"
                    >
                      Marcar como Ya Usados
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden h-full flex flex-col">
                    <div className="p-6 border-b border-outline-variant/20 bg-surface-container-low/30">
                      <h2 className="text-xl font-bold font-headline">EANs Ya Usados</h2>
                    </div>
                    <div className="overflow-y-auto flex-1 p-0">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-surface-container-low/50 text-on-surface-variant font-semibold sticky top-0">
                          <tr>
                            <th className="p-4">EAN-13</th>
                            <th className="p-4">Marca</th>
                            <th className="p-4">Agregado Por</th>
                            <th className="p-4 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                          {eans.filter(e => e.status === 'used').length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-on-surface-variant">
                                No hay EANs marcados como ya usados.
                              </td>
                            </tr>
                          ) : (
                            eans.filter(e => e.status === 'used').map((ean) => {
                              const brand = brands.find(b => b.id === ean.brand_id);
                              return (
                                <tr key={ean.ean} className="hover:bg-surface-container-lowest/50 transition-colors">
                                  <td className="p-4 font-mono font-medium">{ean.ean}</td>
                                  <td className="p-4">{brand?.name || 'Desconocido'}</td>
                                  <td className="p-4 text-on-surface-variant">{ean.updatedBy || 'Desconocido'}</td>
                                  <td className="p-4 text-right flex justify-end gap-4">
                                    <button 
                                      onClick={() => changeEanStatus(ean.ean, 'generated')}
                                      className="text-xs font-bold text-on-surface-variant hover:text-primary hover:underline cursor-pointer"
                                    >
                                      Marcar Generado
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteEan(ean.ean)}
                                      className="text-xs font-bold text-error hover:underline cursor-pointer"
                                    >
                                      Eliminar
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
          </>
        )}
      </main>
      
      {modalMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-container-lowest p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-outline-variant/20"
          >
            <h3 className="text-xl font-bold font-headline mb-2 text-on-surface">{modalMessage.title}</h3>
            <p className="text-on-surface-variant mb-6 whitespace-pre-wrap">{modalMessage.body}</p>
            <button 
              onClick={() => setModalMessage(null)}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}
