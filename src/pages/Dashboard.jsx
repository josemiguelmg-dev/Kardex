import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient.js';

// Importamos todas las vistas desde la nueva carpeta
import Inicio from '../views/Inicio';
import Perfil from '../views/Perfil';
import Configuracion from '../views/Configuracion';
import Chat from '../views/Chat';
import Pacientes from '../views/Pacientes';
import Calendario from '../views/Calendario';

export default function Dashboard({ user }) {
  const [vistaActiva, setVistaActiva] = useState(() => localStorage.getItem('kardex_vista') || 'inicio'); 
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [datosDoctor, setDatosDoctor] = useState({ nombre: '', apellido: '', especialidad: '' });
  const [permisoNotificaciones, setPermisoNotificaciones] = useState(Notification.permission);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(perm => setPermisoNotificaciones(perm));
    }

    const cargarDatos = async () => {
      if (user) {
        const { data } = await supabase.from('doctores').select('nombre, apellido, especialidad').eq('id', user.id).maybeSingle();
        if (data) {
          const nombreCorto = data.nombre ? data.nombre.split(' ')[0] : '';
          const apellidoCorto = data.apellido ? data.apellido.split(' ')[0] : '';
          
          setDatosDoctor({ nombre: nombreCorto, apellido: apellidoCorto, especialidad: data.especialidad || '' });
          
          if (localStorage.getItem('huellaActivada') === 'true') {
            localStorage.setItem('kardex_cred_name', `${nombreCorto} ${apellidoCorto}`.trim());
            localStorage.setItem('kardex_cred_especialidad', data.especialidad || '');
          }
        }
      }
    };
    cargarDatos();
  }, [user]);

  // Listener Global de Alertas
  useEffect(() => {
    const canalAlertas = supabase.channel('alertas-globales')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, (payload) => {
        if (payload.new.user_id !== user?.id) {
          new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Emergencia: ${payload.new.nombre_doctor}`, { body: payload.new.texto, icon: '/favicon.svg' });
          }
        }
      }).subscribe();
    return () => supabase.removeChannel(canalAlertas);
  }, [user]);

  const handleCerrarSesion = async () => {
    sessionStorage.removeItem('sesionActiva');
    localStorage.removeItem('kardex_vista');
    await supabase.auth.signOut();
    window.location.reload();
  };

  const cambiarVista = (vista) => {
    setVistaActiva(vista);
    localStorage.setItem('kardex_vista', vista);
    setMenuAbierto(false);
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#070b14] text-white font-sans overflow-hidden relative">
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      {menuAbierto && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMenuAbierto(false)}></div>}

      <aside className={`fixed inset-y-4 left-4 z-50 w-64 bg-[#141824]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl flex flex-col transition-transform duration-300 ease-in-out ${menuAbierto ? 'translate-x-0' : '-translate-x-[150%]'} md:relative md:translate-x-0 md:inset-auto md:h-[calc(100dvh-2rem)] md:m-4`}>
        <div className="h-20 flex items-center px-6 border-b border-white/5 shrink-0">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg shadow-white/20 mr-3">
            <span className="text-[#070b14] font-black text-xs">KE</span>
          </div>
          <span className="text-xl font-bold tracking-wide">Kardex</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <button onClick={() => cambiarVista('inicio')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${vistaActiva === 'inicio' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Inicio
          </button>
          <button onClick={() => cambiarVista('perfil')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${vistaActiva === 'perfil' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Mi Perfil
          </button>
          <button onClick={() => cambiarVista('configuracion')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${vistaActiva === 'configuracion' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
            Configuración
          </button>
          
          <div className="pt-4 pb-1"><p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Comunicaciones</p></div>
          <button onClick={() => cambiarVista('chat')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${vistaActiva === 'chat' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            Chat Global <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          </button>
          
          <div className="pt-4 pb-1"><p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Módulos Médicos</p></div>
          <button onClick={() => cambiarVista('pacientes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${vistaActiva === 'pacientes' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Mapa de Camas
          </button>
          <button onClick={() => cambiarVista('calendario')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${vistaActiva === 'calendario' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Agenda de Ingresos
          </button>
        </nav>

        <div className="p-4 border-t border-white/5 flex flex-col gap-2 shrink-0">
          <button onClick={handleCerrarSesion} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-2xl font-medium transition-colors">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar Sesión
          </button>
          <div className="text-center mt-1">
            <p className="text-[11px] text-slate-500 font-medium tracking-wide">Dr(a). {datosDoctor.nombre} {datosDoctor.apellido}</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full z-10 relative overflow-hidden">
        <header className="h-20 flex items-center justify-between px-4 sm:px-8 border-b border-white/5 bg-transparent shrink-0">
          <button onClick={() => setMenuAbierto(true)} className="p-2 text-slate-400 hover:text-white bg-[#141824] border border-white/10 rounded-xl md:hidden transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="hidden md:flex flex-col ml-2">
            <h2 className="text-xl font-bold capitalize">
              {vistaActiva === 'pacientes' ? 'Mapa Triage / Camas' : (vistaActiva === 'calendario' ? 'Agenda de Ingresos' : vistaActiva)}
            </h2>
            <span className="text-slate-400 text-xs">Gestión de panel médico</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">{datosDoctor.nombre} {datosDoctor.apellido}</p>
              <p className="text-xs text-cyan-400">{datosDoctor.especialidad}</p>
            </div>
            <div className="w-11 h-11 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center font-bold text-[#070b14] shadow-lg cursor-pointer hover:opacity-90 transition shrink-0" onClick={() => cambiarVista('perfil')}>
              {datosDoctor.nombre ? datosDoctor.nombre.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className={`flex-1 w-full relative ${vistaActiva === 'chat' ? 'p-0 sm:p-4 flex flex-col overflow-hidden' : 'p-4 sm:p-8 overflow-x-hidden overflow-y-auto pb-24'}`}>
          {/* Aquí se inyectan las vistas separadas */}
          {vistaActiva === 'inicio' && <Inicio doctor={datosDoctor} />}
          {vistaActiva === 'perfil' && <Perfil user={user} onActualizar={setDatosDoctor} />}
          {vistaActiva === 'configuracion' && <Configuracion permisoNotificaciones={permisoNotificaciones} setPermisoNotificaciones={setPermisoNotificaciones} doctor={datosDoctor} user={user} />}
          {vistaActiva === 'chat' && <Chat user={user} doctor={datosDoctor} />}
          {vistaActiva === 'pacientes' && <Pacientes doctor={datosDoctor} />}
          {vistaActiva === 'calendario' && <Calendario />}
        </main>
      </div>
    </div>
  );
}