import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient.js';

export default function Calendario() {
  const [historial, setHistorial] = useState([]);
  const [vista, setVista] = useState('mes'); 
  const fechaHoy = new Date();
  
  const mesActual = fechaHoy.toLocaleString('es-ES', { month: 'long' });
  const anioActual = fechaHoy.getFullYear();

  const diasMes = Array.from({ length: 30 }, (_, i) => i + 1);

  useEffect(() => {
    const cargarHistorial = async () => {
      const { data } = await supabase.from('historial_ingresos').select('*').order('created_at', { ascending: false }).limit(200);
      if (data) setHistorial(data);
    };
    cargarHistorial();

    const canalHistorial = supabase.channel('historial-ui')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'historial_ingresos' }, (payload) => {
        setHistorial(prev => [payload.new, ...prev]);
      }).subscribe();

    return () => {
      supabase.removeChannel(canalHistorial);
    };
  }, []);

  const obtenerEventosDelDia = (diaNumero) => {
    return historial.filter(h => {
      const fecha = new Date(h.created_at);
      return fecha.getDate() === diaNumero && fecha.getMonth() === fechaHoy.getMonth() && fecha.getFullYear() === fechaHoy.getFullYear();
    });
  };

  const historialAgrupado = historial.reduce((acc, item) => {
    const fecha = new Date(item.created_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(item);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in max-w-7xl mx-auto flex flex-col gap-6 pb-10">
      
      <div className="bg-gradient-to-r from-[#141824] to-[#0a0d16] p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Agenda de Ingresos</h2>
          <p className="text-sm text-slate-400 capitalize">{mesActual} {anioActual}</p>
        </div>
        
        <div className="flex bg-[#0a0d16] p-1.5 rounded-2xl w-fit border border-white/5 shadow-sm">
          <button onClick={() => setVista('mes')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${vista === 'mes' ? 'bg-[#141824] text-cyan-400 shadow-md border border-white/5' : 'text-slate-500 hover:text-white'}`}>
            Mes
          </button>
          <button onClick={() => setVista('semana')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${vista === 'semana' ? 'bg-[#141824] text-cyan-400 shadow-md border border-white/5' : 'text-slate-500 hover:text-white'}`}>
            Semana
          </button>
        </div>
      </div>

      {vista === 'mes' && (
        <div className="bg-[#141824] rounded-[2rem] border border-white/5 shadow-xl overflow-hidden flex flex-col">
          <div className="grid grid-cols-7 bg-[#0a0d16] border-b border-white/5">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dia => (
              <div key={dia} className="py-3 text-center text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest border-r border-white/5 last:border-none">
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 bg-[#141824]">
            {diasMes.map(dia => {
              const eventos = obtenerEventosDelDia(dia);
              const esHoy = dia === fechaHoy.getDate();

              return (
                <div key={dia} className={`min-h-[80px] sm:min-h-[120px] p-2 sm:p-3 border-r border-b border-white/5 last:border-r-0 flex flex-col gap-1 transition-colors hover:bg-white/5 ${esHoy ? 'bg-cyan-500/5' : ''}`}>
                  <span className={`text-xs sm:text-sm font-bold ${esHoy ? 'text-cyan-400 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full' : 'text-slate-400'}`}>
                    {dia}
                  </span>
                  
                  <div className="flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-hide mt-1">
                    {eventos.map((ev, idx) => (
                      <div key={idx} className="bg-cyan-500/10 border border-cyan-500/20 rounded px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] text-cyan-300 truncate" title={ev.diagnostico}>
                        <span className="font-bold">{ev.cama_id}</span> - {ev.doctor.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {vista === 'semana' && (
        <div className="bg-[#141824] p-4 sm:p-8 rounded-[2rem] border border-white/5 shadow-xl">
          {Object.keys(historialAgrupado).length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center">
              
              <img src="/morning.svg" alt="Ilustración médica" className="h-24 sm:h-32 w-auto z-10 drop-shadow-2xl" />
              
              <span className="text-slate-300 text-lg font-bold">La agenda está vacía</span>
              <p className="text-sm text-slate-500 mt-1">Registra un paciente en el Mapa de Camas y aparecerá aquí.</p>
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
                      <div key={item.id} className="bg-[#141824] border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-white/10 transition-colors shadow-md">
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