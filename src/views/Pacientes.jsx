import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient.js';

export default function Pacientes({ doctor }) {
  const [subVista, setSubVista] = useState('mapa'); 
  const [camas, setCamas] = useState([]);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroSector, setFiltroSector] = useState('Todos');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [camaSeleccionada, setCamaSeleccionada] = useState('');
  const [diagnosticoInput, setDiagnosticoInput] = useState('');
  const [guardando, setGuardando] = useState(false);

  const plantillas = ['ECV hemorrágico', 'ECV isquémico', 'HDS S/V', 'Politraumatizado', 'Sepsis', 'Crisis Hipertensiva'];

  const camasSectorA_Derecho = ['A-1.1', 'A-1.2', 'A-2.1', 'A-2.2', 'A-3.1', 'A-3.2', 'A-4.1', 'A-4.2', 'A-5.1', 'A-5.2'];
  const camasSectorB_Izquierdo = ['B-5.2', 'B-5.1', 'B-4.2', 'B-4.1', 'B-3.2', 'B-3.1', 'B-2.2', 'B-2.1', 'B-1.2', 'B-1.1'];
  const camasSectorA_Izquierdo = ['A-10.2', 'A-10.1', 'A-9.2', 'A-9.1', 'A-8.2', 'A-8.1', 'A-7.2', 'A-7.1', 'A-6.2', 'A-6.1'];
  const camasSectorObs = ['OBS-1', 'OBS-2', 'OBS-3', 'OBS-4', 'OBS-5', 'OBS-6', 'OBS-7', 'OBS-8', 'OBS-9', 'OBS-10', 'OBS-11', 'OBS-12', 'OBS-13', 'OBS-14', 'OBS-15'];
  const camasSectorTS = ['TS-1', 'TS-2', 'TS-3', 'TS-4'];

  const camasDefecto = [
    ...camasSectorA_Derecho.map(id => ({ id, sector: 'Sector A', ocupada: false, diagnostico: '', actualizado_por: '' })),
    ...camasSectorB_Izquierdo.map(id => ({ id, sector: 'Sector B', ocupada: false, diagnostico: '', actualizado_por: '' })),
    ...camasSectorA_Izquierdo.map(id => ({ id, sector: 'Sector A', ocupada: false, diagnostico: '', actualizado_por: '' })),
    ...camasSectorObs.map(id => ({ id, sector: 'Observación', ocupada: false, diagnostico: '', actualizado_por: '' })),
    ...camasSectorTS.map(id => ({ id, sector: 'Traumashock', ocupada: false, diagnostico: '', actualizado_por: '' }))
  ];

  useEffect(() => {
    const initCamas = async () => {
      const { data } = await supabase.from('camas').select('*').order('id', { ascending: true });
      if (data && data.length > 0) {
        const camasMezcladas = camasDefecto.map(c_defecto => {
          const c_db = data.find(d => d.id === c_defecto.id);
          return c_db ? c_db : c_defecto;
        });
        setCamas(camasMezcladas);
      } else {
        await supabase.from('camas').upsert(camasDefecto);
        setCamas(camasDefecto);
      }
    };
    initCamas();

    const canalCamas = supabase
      .channel('camas-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'camas' }, (payload) => {
        setCamas(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
      })
      .subscribe();

    // Retorno protegido con llaves
    return () => {
      supabase.removeChannel(canalCamas);
    };
  }, []);

  const totalOcupadas = camas.filter(c => c.ocupada).length;

  const abrirRegistro = (id) => {
    setCamaSeleccionada(id); setDiagnosticoInput(''); setModalAbierto(true);
  };

  const guardarDiagnostico = async (e) => {
    e.preventDefault();
    if (!camaSeleccionada || !diagnosticoInput.trim()) return;
    setGuardando(true);
    const docActual = `Dr(a). ${doctor.nombre} ${doctor.apellido}`.trim() || 'Médico de Guardia';
    await supabase.from('camas').update({ ocupada: true, diagnostico: diagnosticoInput, actualizado_por: docActual }).eq('id', camaSeleccionada);
    await supabase.from('historial_ingresos').insert([{ cama_id: camaSeleccionada, diagnostico: diagnosticoInput, doctor: docActual }]);
    setModalAbierto(false); setGuardando(false);
  };

  const liberarCama = async (e, id) => {
    e.stopPropagation();
    await supabase.from('camas').update({ ocupada: false, diagnostico: null, actualizado_por: null }).eq('id', id);
  };

  const obtenerDatosCama = (id) => camas.find(c => c.id === id) || { id, ocupada: false, diagnostico: '' };

  const Cama = ({ data }) => {
    const esTraumashock = data.id.startsWith('TS');
    if (data.ocupada) {
      return (
        <div className={`bg-[#0a0d16] border-2 rounded-2xl p-4 flex flex-col items-center justify-between gap-2 shadow-lg w-full h-28 relative overflow-hidden group ${esTraumashock ? 'border-red-500/40 shadow-red-500/10' : 'border-cyan-500/40 shadow-cyan-500/10'}`}>
          <div className={`absolute top-0 inset-x-0 h-1 ${esTraumashock ? 'bg-red-500' : 'bg-cyan-400'}`}></div>
          <div className="w-full flex justify-between items-start">
            <span className={`${esTraumashock ? 'text-red-400' : 'text-cyan-400'} font-bold text-sm`}>{data.id}</span>
            <button onClick={(e) => liberarCama(e, data.id)} className="text-slate-500 hover:text-white bg-white/5 hover:bg-red-500/80 p-1.5 rounded-lg transition-all" title="Liberar Cama">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <p className="text-[11px] text-slate-200 w-full text-center line-clamp-2 leading-tight font-medium">{data.diagnostico}</p>
          <p className="text-[9px] text-slate-500 truncate w-full text-center mt-1">Por: {data.actualizado_por}</p>
        </div>
      );
    }
    return (
      <button onClick={() => abrirRegistro(data.id)} className="bg-[#0a0d16] border border-white/5 hover:border-white/20 hover:bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all w-full h-28 group">
        <span className={`font-bold text-base sm:text-lg transition-colors ${esTraumashock ? 'text-slate-300 group-hover:text-red-400' : 'text-white group-hover:text-cyan-400'}`}>{data.id}</span>
        <div className={`flex items-center gap-1.5 text-slate-500 transition-colors ${esTraumashock ? 'group-hover:text-red-400' : 'group-hover:text-cyan-400'}`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Registrar</span>
        </div>
      </button>
    );
  };

  const FiltrosSectores = ['Todos', 'Sector A', 'Sector B', 'Observación', 'Traumashock', 'Otros'];
  const camasFiltradas = camas.filter(c => {
    const cumpleTexto = c.id.toLowerCase().includes(filtroTexto.toLowerCase()) || (c.diagnostico && c.diagnostico.toLowerCase().includes(filtroTexto.toLowerCase()));
    const cumpleSector = filtroSector === 'Todos' || c.sector === filtroSector;
    return cumpleTexto && cumpleSector;
  });

  return (
    <div className="animate-fade-in max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8 pb-10">
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[#141824] p-5 rounded-3xl border border-white/5 shadow-md flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-cyan-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-[10px] font-bold uppercase tracking-widest">En Guardia</span>
          </div>
          <span className="text-3xl font-bold text-white">{totalOcupadas}</span>
        </div>
        <div className="bg-[#141824] p-5 rounded-3xl border border-white/5 shadow-md flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-blue-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            <span className="text-[10px] font-bold uppercase tracking-widest">Disponibles</span>
          </div>
          <span className="text-3xl font-bold text-white">{camas.length - totalOcupadas}</span>
        </div>
        <div className="bg-[#141824] p-5 rounded-3xl border border-white/5 shadow-md flex flex-col justify-center col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-2 text-purple-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[10px] font-bold uppercase tracking-widest">Triage Rápido</span>
          </div>
          <span className="text-3xl font-bold text-white">0</span>
        </div>
      </div>

      <div className="flex bg-[#0a0d16] p-1.5 rounded-2xl w-fit border border-white/5 shadow-sm">
        <button onClick={() => setSubVista('mapa')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${subVista === 'mapa' ? 'bg-[#141824] text-cyan-400 shadow-md border border-white/5' : 'text-slate-500 hover:text-white'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
          Pizarra Fija (Completa)
        </button>
        <button onClick={() => setSubVista('lista')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${subVista === 'lista' ? 'bg-[#141824] text-cyan-400 shadow-md border border-white/5' : 'text-slate-500 hover:text-white'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Búsqueda y Filtros
        </button>
      </div>

      {subVista === 'mapa' && (
        <div className="bg-[#141824] p-4 sm:p-8 rounded-[2rem] border border-white/5 shadow-xl animate-fade-in">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div><h3 className="text-lg font-bold text-white">Pizarra Virtual del Triage</h3><p className="text-xs text-slate-400 mt-1">Todas las camas en su distribución real.</p></div>
            <button onClick={() => abrirRegistro('')} className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-[#070b14] font-bold rounded-full hover:opacity-90 transition-opacity text-sm shadow-lg shadow-cyan-500/20 whitespace-nowrap">+ Nuevo Paciente</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
            <div>
              <div className="border-b border-cyan-500/20 pb-2 mb-4 flex flex-col">
                <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div><h4 className="text-cyan-400 text-sm font-bold tracking-wide">1. SECTOR A (DERECHO)</h4></div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-4">Baja Densidad Ascent.</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">{camasSectorA_Derecho.map(id => <Cama key={id} data={obtenerDatosCama(id)} />)}</div>
            </div>
            <div>
              <div className="border-b border-blue-500/20 pb-2 mb-4 flex flex-col">
                <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div><h4 className="text-blue-400 text-sm font-bold tracking-wide">3. SECTOR B (IZQUIERDO)</h4></div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-4">Cama Dúo Observación</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">{camasSectorB_Izquierdo.map(id => <Cama key={id} data={obtenerDatosCama(id)} />)}</div>
            </div>
            <div>
              <div className="border-b border-cyan-500/20 pb-2 mb-4 flex flex-col">
                <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div><h4 className="text-cyan-400 text-sm font-bold tracking-wide">2. SECTOR A (IZQUIERDO)</h4></div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-4">Alta Densidad Descent.</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">{camasSectorA_Izquierdo.map(id => <Cama key={id} data={obtenerDatosCama(id)} />)}</div>
            </div>
            <div>
              <div className="border-b border-indigo-500/20 pb-2 mb-4 flex flex-col">
                <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></div><h4 className="text-indigo-400 text-sm font-bold tracking-wide">4. SECTOR OBSERVACIÓN</h4></div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-4">Observación General</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">{camasSectorObs.map(id => <Cama key={id} data={obtenerDatosCama(id)} />)}</div>
            </div>
            <div className="xl:col-span-2 mt-2">
              <div className="border-b border-red-500/30 pb-2 mb-4 flex flex-col bg-red-500/5 px-4 rounded-t-lg pt-2">
                <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div><h4 className="text-red-400 text-sm font-bold tracking-wide">5. SECTOR TRAUMASHOCK</h4></div>
                <span className="text-[10px] text-red-500/70 font-bold uppercase tracking-wider pl-4">Área Crítica - Reanimación</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-2">{camasSectorTS.map(id => <Cama key={id} data={obtenerDatosCama(id)} />)}</div>
            </div>
          </div>
        </div>
      )}

      {subVista === 'lista' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="bg-[#141824] p-2 pr-2 sm:pr-4 rounded-full border border-white/10 shadow-md flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 flex items-center px-4 w-full">
              <svg className="w-5 h-5 text-slate-500 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} placeholder="Buscar paciente, cama o diagnóstico..." className="w-full bg-transparent border-none text-white text-sm focus:outline-none placeholder-slate-500 py-3" />
            </div>
          </div>

          <div className="bg-[#141824] p-2 rounded-2xl border border-white/10 shadow-md flex overflow-x-auto scrollbar-hide items-center text-xs sm:text-sm font-medium gap-1 sm:gap-2">
            <span className="text-slate-500 px-4 shrink-0 hidden sm:block text-xs font-bold uppercase tracking-widest">Filtrar:</span>
            {FiltrosSectores.map(sec => (
              <button key={sec} onClick={() => setFiltroSector(sec)} className={`shrink-0 px-5 py-2.5 rounded-xl transition-all ${filtroSector === sec ? 'bg-cyan-500 text-[#070b14] font-bold shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                {sec === 'Todos' ? `Todos (${camas.length})` : sec}
              </button>
            ))}
          </div>

          <div className="bg-[#141824] p-4 sm:p-8 rounded-[2rem] border border-white/5 shadow-xl">
            {camasFiltradas.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center">
                <span className="text-slate-400 font-medium">No hay camas con esta búsqueda.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 sm:gap-10">
                {(filtroSector === 'Todos' || filtroSector === 'Sector A') && camasFiltradas.some(c => c.sector === 'Sector A') && (
                  <div className="xl:col-span-2">
                    <div className="border-b border-cyan-500/20 pb-2 mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-400"></div><h4 className="text-cyan-400 text-sm font-bold tracking-wide uppercase">Sector A</h4></div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">{camasFiltradas.filter(c => c.sector === 'Sector A').map(c => <Cama key={c.id} data={c} />)}</div>
                  </div>
                )}
                {(filtroSector === 'Todos' || filtroSector === 'Sector B') && camasFiltradas.some(c => c.sector === 'Sector B') && (
                  <div className="xl:col-span-2 mt-2">
                    <div className="border-b border-blue-500/20 pb-2 mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400"></div><h4 className="text-blue-400 text-sm font-bold tracking-wide uppercase">Sector B</h4></div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">{camasFiltradas.filter(c => c.sector === 'Sector B').map(c => <Cama key={c.id} data={c} />)}</div>
                  </div>
                )}
                {(filtroSector === 'Todos' || filtroSector === 'Observación') && camasFiltradas.some(c => c.sector === 'Observación') && (
                  <div className="xl:col-span-2 mt-2">
                    <div className="border-b border-indigo-500/20 pb-2 mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-400"></div><h4 className="text-indigo-400 text-sm font-bold tracking-wide uppercase">Sector Observación</h4></div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">{camasFiltradas.filter(c => c.sector === 'Observación').map(c => <Cama key={c.id} data={c} />)}</div>
                  </div>
                )}
                {(filtroSector === 'Todos' || filtroSector === 'Traumashock') && camasFiltradas.some(c => c.sector === 'Traumashock') && (
                  <div className="xl:col-span-2 mt-2">
                    <div className="border-b border-red-500/30 pb-2 mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div><h4 className="text-red-400 text-sm font-bold tracking-wide uppercase">Sector Traumashock</h4></div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-2">{camasFiltradas.filter(c => c.sector === 'Traumashock').map(c => <Cama key={c.id} data={c} />)}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL DE REGISTRO MINIMALISTA --- */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-[#070b14]/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141824] border border-white/10 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="h-28 bg-[#0a0d16] relative flex items-center justify-center border-b border-white/5 overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[40px] rounded-full"></div>
              <svg className="w-10 h-10 text-slate-600/50 absolute" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              <span className="text-slate-500 text-[10px] font-bold tracking-widest uppercase z-10 border border-slate-700/50 px-4 py-2 rounded-lg bg-[#0a0d16]/80 backdrop-blur-md">Espacio para Imagen</span>
            </div>
            <div className="p-6 sm:p-8 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
              <div><h3 className="text-xl font-bold text-white mb-1">Registrar Ingreso</h3><p className="text-slate-400 text-xs">Asigna un diagnóstico rápido para ocupar la cama.</p></div>
              <form onSubmit={guardarDiagnostico} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400 ml-1">Ubicación / Cama *</label>
                  <select value={camaSeleccionada} onChange={(e) => setCamaSeleccionada(e.target.value)} required className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors appearance-none">
                    <option value="" disabled>Selecciona una cama vacía...</option>
                    {camas.filter(c => !c.ocupada).map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400 ml-1">Diagnóstico de Emergencia *</label>
                  <textarea rows="3" value={diagnosticoInput} onChange={(e) => setDiagnosticoInput(e.target.value)} required placeholder="Ej: Dolor abdominal agudo..." className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors resize-none"></textarea>
                </div>
                <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 text-slate-400 hover:text-white text-sm font-medium transition-colors">Cancelar</button>
                  <button type="submit" disabled={guardando} className="px-6 py-2.5 bg-cyan-500 text-[#070b14] font-bold rounded-xl hover:bg-cyan-400 transition-colors text-sm disabled:opacity-50">{guardando ? 'Guardando...' : 'Asignar Cama'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}