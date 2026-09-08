import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient.js';

export default function Calendario() {
  const [historial, setHistorial] = useState([]);
  
  // Vistas: 'dia' (Línea de tiempo), 'mes' (Calendario pequeño), 'lista' (Historial completo)
  const [vista, setVista] = useState('dia'); 
  
  // Fecha para ver el detalle de un día específico
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  
  // Fecha para navegar entre los meses en el calendario pequeño
  const [fechaNavegacion, setFechaNavegacion] = useState(new Date());
  
  const diasRef = useRef([]);

  // Variables para la vista Día a Día
  const mesActualDia = fechaSeleccionada.toLocaleString('es-ES', { month: 'long' });
  const anioActualDia = fechaSeleccionada.getFullYear();
  const diasDelMesTira = Array.from(
    { length: new Date(anioActualDia, fechaSeleccionada.getMonth() + 1, 0).getDate() },
    (_, i) => new Date(anioActualDia, fechaSeleccionada.getMonth(), i + 1)
  );

  // Variables para el Calendario Pequeño (Mes Completo)
  const mesVisual = fechaNavegacion.toLocaleString('es-ES', { month: 'long' });
  const anioVisual = fechaNavegacion.getFullYear();
  const primerDiaMes = new Date(anioVisual, fechaNavegacion.getMonth(), 1).getDay();
  const diasVacios = primerDiaMes === 0 ? 6 : primerDiaMes - 1; // Ajuste para que Lunes sea el primer día
  const diasEnMes = new Date(anioVisual, fechaNavegacion.getMonth() + 1, 0).getDate();

  useEffect(() => {
    const cargarHistorial = async () => {
      const { data } = await supabase.from('historial_ingresos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);
      if (data) setHistorial(data);
    };
    cargarHistorial();

    const canalHistorial = supabase.channel('historial-ui')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'historial_ingresos' }, (payload) => {
        setHistorial(prev => [payload.new, ...prev]);
      }).subscribe();

    return () => supabase.removeChannel(canalHistorial);
  }, []);

  // Scroll automático en la tira de "Día a Día"
  useEffect(() => {
    if (vista === 'dia' && diasRef.current[fechaSeleccionada.getDate() - 1]) {
      diasRef.current[fechaSeleccionada.getDate() - 1].scrollIntoView({
        behavior: 'smooth', block: 'nearest', inline: 'center'
      });
    }
  }, [vista, fechaSeleccionada]);

  const esMismoDia = (fecha1, fecha2) => {
    return fecha1.getDate() === fecha2.getDate() &&
           fecha1.getMonth() === fecha2.getMonth() &&
           fecha1.getFullYear() === fecha2.getFullYear();
  };

  const obtenerEventosDelDia = (fechaObj) => {
    return historial.filter(h => esMismoDia(new Date(h.created_at), fechaObj));
  };

  const historialAgrupado = historial.reduce((acc, item) => {
    const fecha = new Date(item.created_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(item);
    return acc;
  }, {});

  const obtenerIconoDiagnostico = (diagnostico) => {
    const texto = diagnostico.toLowerCase();
    if (texto.includes('urgencia') || texto.includes('hemorrágico') || texto.includes('trauma')) {
      return <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    }
    if (texto.includes('control') || texto.includes('estable')) {
      return <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
    return <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
  };

  // Funciones de navegación del mes
  const mesAnterior = () => setFechaNavegacion(new Date(anioVisual, fechaNavegacion.getMonth() - 1, 1));
  const mesSiguiente = () => setFechaNavegacion(new Date(anioVisual, fechaNavegacion.getMonth() + 1, 1));

  return (
    <div className="animate-fade-in max-w-7xl mx-auto flex flex-col gap-6 pb-10">
      
      {/* 1. HEADER Y BOTONES DE VISTA */}
      <div className="bg-gradient-to-r from-[#141824] to-[#0a0d16] p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Agenda de Ingresos</h2>
          <p className="text-sm text-slate-400 capitalize">
            {vista === 'mes' ? `${mesVisual} ${anioVisual}` : `${mesActualDia} ${anioActualDia}`}
          </p>
        </div>
        
        <div className="flex bg-[#0a0d16] p-1.5 rounded-2xl w-full sm:w-fit border border-white/5 shadow-sm overflow-x-auto scrollbar-hide">
          <button onClick={() => setVista('dia')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${vista === 'dia' ? 'bg-[#141824] text-cyan-400 shadow-md border border-white/5' : 'text-slate-500 hover:text-white'}`}>
            Día a Día
          </button>
          <button onClick={() => setVista('mes')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${vista === 'mes' ? 'bg-[#141824] text-cyan-400 shadow-md border border-white/5' : 'text-slate-500 hover:text-white'}`}>
            Mes Completo
          </button>
          <button onClick={() => setVista('lista')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${vista === 'lista' ? 'bg-[#141824] text-cyan-400 shadow-md border border-white/5' : 'text-slate-500 hover:text-white'}`}>
            Lista General
          </button>
        </div>
      </div>

      {/* =========================================================
          VISTA 1: CALENDARIO MENSUAL PEQUEÑO (NUEVO)
      ========================================================= */}
      {vista === 'mes' && (
        <div className="bg-[#141824] p-6 sm:p-8 rounded-[2rem] border border-white/5 shadow-xl max-w-md mx-auto w-full animate-fade-in">
          
          {/* Navegación del Mes */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={mesAnterior} className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h3 className="text-lg sm:text-xl font-bold text-white capitalize tracking-wide">
              {mesVisual} <span className="text-cyan-400">{anioVisual}</span>
            </h3>
            <button onClick={mesSiguiente} className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 mb-4">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="text-center text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>

          {/* Cuadrícula del mes */}
          <div className="grid grid-cols-7 gap-y-2 sm:gap-y-4 gap-x-1 sm:gap-x-2">
            {/* Espacios vacíos antes del día 1 */}
            {Array.from({ length: diasVacios }).map((_, i) => (
              <div key={`empty-${i}`}></div>
            ))}
            
            {/* Días reales del mes */}
            {Array.from({ length: diasEnMes }).map((_, i) => {
              const diaNum = i + 1;
              const fechaDia = new Date(anioVisual, fechaNavegacion.getMonth(), diaNum);
              const esHoy = esMismoDia(fechaDia, new Date());
              const esSeleccionado = esMismoDia(fechaDia, fechaSeleccionada);
              const eventosDelDia = obtenerEventosDelDia(fechaDia);
              const tieneEventos = eventosDelDia.length > 0;

              return (
                <button
                  key={diaNum}
                  onClick={() => {
                    setFechaSeleccionada(fechaDia);
                    setVista('dia'); // Al tocar un día, te lleva a ver los detalles
                  }}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all relative group
                    ${esSeleccionado ? 'bg-cyan-500 text-[#070b14] font-black shadow-lg shadow-cyan-500/30' : 
                      esHoy ? 'border-2 border-cyan-500/50 text-cyan-400 font-bold bg-[#0a0d16]' : 
                      'text-slate-300 hover:bg-white/5 font-medium'}
                  `}
                >
                  <span className="text-sm sm:text-base">{diaNum}</span>
                  
                  {/* Puntito indicador si hay ingresos ese día */}
                  {tieneEventos && (
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-0.5 absolute bottom-1 sm:bottom-1.5
                      ${esSeleccionado ? 'bg-[#070b14]' : 'bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]'}
                    `}></div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2">
             <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]"></div>
             <span className="text-xs text-slate-400">Días con ingresos registrados</span>
          </div>
        </div>
      )}

      {/* =========================================================
          VISTA 2: DÍA A DÍA (LÍNEA DE TIEMPO HORIZONTAL)
      ========================================================= */}
      {vista === 'dia' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          
          <div className="bg-[#141824] rounded-[2rem] border border-white/5 shadow-xl p-4">
            <div className="flex overflow-x-auto scrollbar-hide gap-2 sm:gap-4 py-2 px-2 snap-x">
              {diasDelMesTira.map((fecha, idx) => {
                const esSeleccionado = esMismoDia(fecha, fechaSeleccionada);
                const nombreDia = fecha.toLocaleString('es-ES', { weekday: 'short' }).substring(0, 3);
                const numeroDia = fecha.getDate();
                const eventos = obtenerEventosDelDia(fecha);
                
                return (
                  <button
                    key={idx}
                    ref={el => diasRef.current[idx] = el}
                    onClick={() => setFechaSeleccionada(fecha)}
                    className={`flex flex-col items-center justify-center min-w-[60px] h-[80px] rounded-2xl transition-all snap-center shrink-0 ${esSeleccionado ? 'bg-[#0a0d16] border border-cyan-500/30 shadow-lg' : 'bg-transparent hover:bg-white/5 border border-transparent'}`}
                  >
                    <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${esSeleccionado ? 'text-cyan-400' : 'text-slate-500'}`}>
                      {nombreDia}
                    </span>
                    <span className={`text-xl font-bold ${esSeleccionado ? 'text-white' : 'text-slate-300'}`}>
                      {numeroDia}
                    </span>
                    <div className="flex gap-1 mt-1.5 h-1.5">
                      {eventos.slice(0, 3).map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>)}
                      {eventos.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50"></div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#141824] rounded-[2rem] border border-white/5 shadow-xl p-4 sm:p-8 min-h-[300px]">
            <h3 className="text-lg font-bold text-white mb-6 pl-2 capitalize border-b border-white/5 pb-4">
              Ingresos del {fechaSeleccionada.toLocaleString('es-ES', { weekday: 'long' })} {fechaSeleccionada.getDate()}
            </h3>

            {obtenerEventosDelDia(fechaSeleccionada).length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center">
                <svg className="w-12 h-12 text-slate-600/50 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-slate-400 font-medium">No hay ingresos registrados en esta fecha.</span>
              </div>
            ) : (
              <div className="flex flex-col relative pl-2 sm:pl-4">
                <div className="absolute left-[64px] sm:left-[84px] top-4 bottom-4 w-px bg-white/10"></div>
                {obtenerEventosDelDia(fechaSeleccionada).map((ev, idx) => (
                  <div key={ev.id} className="flex items-start gap-4 sm:gap-6 mb-6 relative group">
                    <div className="w-12 sm:w-16 pt-3 text-right shrink-0">
                      <span className="text-cyan-400 font-bold text-sm sm:text-base tracking-wide">
                        {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="relative pt-4 z-10 shrink-0">
                      <div className="w-3 h-3 bg-[#141824] border-2 border-cyan-400 rounded-full group-hover:bg-cyan-400 transition-colors shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div>
                    </div>
                    <div className="flex-1 bg-[#0a0d16] border border-white/5 hover:border-cyan-500/20 rounded-2xl p-4 sm:p-5 shadow-md flex items-center justify-between gap-4 transition-all">
                      <div className="flex flex-col gap-1">
                        <span className="text-white font-bold text-sm sm:text-base">ID/Cama: {ev.cama_id}</span>
                        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-2">Diag: {ev.diagnostico}</p>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Por {ev.doctor}</span>
                      </div>
                      <div className="shrink-0 p-2 bg-white/5 rounded-xl hidden sm:flex">
                        {obtenerIconoDiagnostico(ev.diagnostico)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          VISTA 3: LISTA GENERAL DE HISTORIAL
      ========================================================= */}
      {vista === 'lista' && (
        <div className="bg-[#141824] p-4 sm:p-8 rounded-[2rem] border border-white/5 shadow-xl animate-fade-in">
          {Object.keys(historialAgrupado).length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center">
              
              {/* IMAGEN DE AGENDA VACÍA PARA LA LISTA GENERAL */}
              <img 
                src="/morning.svg" 
                alt="Agenda Vacía" 
                className="w-32 sm:w-40 h-auto mb-4 drop-shadow-xl z-10 object-contain" 
              />
              
              <span className="text-slate-300 text-lg font-bold">El historial está vacío</span>
              <p className="text-sm text-slate-500 mt-1">Registra pacientes en la pizarra para verlos aquí.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {Object.keys(historialAgrupado).map((fecha) => (
                <div key={fecha} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest px-2 capitalize">{fecha}</span>
                    <div className="h-px bg-white/10 flex-1"></div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {historialAgrupado[fecha].map((item) => (
                      <div key={item.id} className="bg-[#0a0d16] border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-white/10 transition-colors shadow-md">
                        <div className="flex items-center sm:flex-col sm:justify-center sm:w-24 shrink-0 border-b sm:border-b-0 sm:border-r border-white/5 pb-3 sm:pb-0 sm:pr-4 gap-2 sm:gap-0">
                          <span className="text-lg font-bold text-white">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-bold px-2.5 py-1 rounded-md border border-cyan-500/20">Cama: {item.cama_id}</span>
                            <span className="text-xs font-medium text-slate-400">Por {item.doctor}</span>
                          </div>
                          <p className="text-sm text-slate-200 mt-1 leading-relaxed">{item.diagnostico}</p>
                        </div>
                        <div className="hidden sm:block shrink-0">
                           {obtenerIconoDiagnostico(item.diagnostico)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}