import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient.js';

export default function Chat({ user, doctor }) {
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const mensajesFinRef = useRef(null);

  const sugerenciasRapidas = [
    "👨‍⚕️ Solicito apoyo médico",
    "✅ Paciente estabilizado",
    "🚑 Ingresando ambulancia",
  ];

  const hacerScrollAlFondo = () => {
    mensajesFinRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Cargar mensajes e iniciar tiempo real (Con retorno seguro)
  useEffect(() => {
    const cargarMensajes = async () => {
      const { data } = await supabase.from('mensajes').select('*').order('created_at', { ascending: true }).limit(100);
      if (data) setMensajes(data);
    };
    
    cargarMensajes();

    const canal = supabase.channel('public:mensajes-ui')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, (payload) => {
        setMensajes((prev) => [...prev, payload.new]);
      })
      .subscribe();

    // El return de limpieza debe estar explícito con llaves
    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  // 2. Hacer scroll al fondo (Solución a la pantalla blanca)
  useEffect(() => {
    hacerScrollAlFondo();
  }, [mensajes]);

  const enviarMensaje = async (e) => {
    if (e) e.preventDefault();
    if (!nuevoMensaje.trim() || !user) return;
    
    const msjTexto = nuevoMensaje;
    setNuevoMensaje('');
    
    await supabase.from('mensajes').insert([{ 
      user_id: user.id, 
      nombre_doctor: `Dr(a). ${doctor?.nombre || ''} ${doctor?.apellido || ''}`.trim() || 'Doctor', 
      texto: msjTexto 
    }]);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#141824] sm:rounded-3xl border-x sm:border border-white/10 overflow-hidden shadow-2xl relative">
      <div className="h-16 bg-[#0a0d16]/80 backdrop-blur-md border-b border-white/5 flex items-center px-6 shrink-0 z-10">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-3"></div>
        <h3 className="font-bold text-white">Canal de Emergencias</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[url('/imge.jpg')] bg-cover bg-center bg-blend-overlay bg-[#070b14]/95 scroll-smooth">
        {mensajes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <p>No hay mensajes aún.</p>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {mensajes.map((msj) => {
              const esMio = msj.user_id === user?.id;
              return (
                <div key={msj.id} className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}>
                  <span className={`text-[11px] font-medium mb-1 ${esMio ? 'text-cyan-400 mr-2' : 'text-slate-400 ml-2'}`}>
                    {esMio ? 'Tú' : msj.nombre_doctor}
                  </span>
                  <div className={`px-4 py-2.5 max-w-[85%] sm:max-w-[70%] rounded-2xl ${esMio ? 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md rounded-br-sm' : 'bg-[#1a2035] text-slate-200 border border-white/5 shadow-md rounded-bl-sm'}`}>
                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msj.texto}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={mensajesFinRef} />
      </div>

      <div className="bg-[#0a0d16] border-t border-white/5 shrink-0 flex flex-col pb-safe">
        <div className="flex gap-2 overflow-x-auto p-3 scrollbar-hide px-4 sm:px-6">
          {sugerenciasRapidas.map((sug, i) => (
            <button key={i} type="button" onClick={() => setNuevoMensaje(sug)} className="shrink-0 bg-[#141824] border border-white/10 hover:bg-white/10 text-cyan-400/80 text-[11px] font-medium px-3 py-1.5 rounded-full">
              {sug}
            </button>
          ))}
        </div>
        <form onSubmit={enviarMensaje} className="px-4 pb-4 sm:px-6">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <input type="text" value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} placeholder="Escribe un mensaje de emergencia..." className="flex-1 bg-[#141824] border border-white/10 rounded-full px-5 py-3 text-white text-sm focus:outline-none focus:border-cyan-500" />
            <button type="submit" disabled={!nuevoMensaje.trim()} className="w-11 h-11 rounded-full bg-cyan-500 flex items-center justify-center text-slate-900 shrink-0 hover:bg-cyan-400 transition-colors">
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}