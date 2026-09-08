import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient.js';

export default function Dashboard({ user }) {
  const [vistaActiva, setVistaActiva] = useState('inicio'); 
  const [menuAbierto, setMenuAbierto] = useState(false);
  
  const [datosDoctor, setDatosDoctor] = useState({ nombre: '', apellido: '', especialidad: '' });
  const [permisoNotificaciones, setPermisoNotificaciones] = useState(Notification.permission);

  // Estados Globales para el Modal de Huella
  const [tieneHuella, setTieneHuella] = useState(localStorage.getItem('huellaActivada') === 'true');
  const [mostrarModalHuellaGlobal, setMostrarModalHuellaGlobal] = useState(false);
  const [mensajeHuella, setMensajeHuella] = useState({ tipo: '', texto: '' });

  // 1. Cargar Datos y Pedir Permisos
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(perm => {
        setPermisoNotificaciones(perm);
      });
    }

    const cargarDatos = async () => {
      if (user) {
        const { data } = await supabase.from('doctores').select('nombre, apellido, especialidad').eq('id', user.id).maybeSingle();
        if (data) {
          const nombreCorto = data.nombre ? data.nombre.split(' ')[0] : '';
          const apellidoCorto = data.apellido ? data.apellido.split(' ')[0] : '';
          
          setDatosDoctor({ nombre: nombreCorto, apellido: apellidoCorto, especialidad: data.especialidad || '' });
          
          const quiereHuella = localStorage.getItem('quiereHuella') === 'true';
          const hActivada = localStorage.getItem('huellaActivada') === 'true';
          
          if (hActivada) {
            localStorage.setItem('kardex_cred_name', `${nombreCorto} ${apellidoCorto}`.trim());
            localStorage.setItem('kardex_cred_especialidad', data.especialidad || '');
          } else if (quiereHuella && window.PublicKeyCredential) {
            window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(disp => {
              if (disp) setMostrarModalHuellaGlobal(true);
            });
          }
        }
      }
    };
    cargarDatos();
  }, [user]);

  // 2. LISTENER GLOBAL DE EMERGENCIAS
  useEffect(() => {
    const canalAlertas = supabase
      .channel('alertas-globales')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, (payload) => {
        if (payload.new.user_id !== user?.id) {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(e => console.log('El navegador bloqueó el autoplay', e));

          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Emergencia: ${payload.new.nombre_doctor}`, {
              body: payload.new.texto,
              icon: '/favicon.svg', 
              vibrate: [200, 100, 200] 
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canalAlertas);
    };
  }, [user]);

  const registrarHuellaGlobal = async () => {
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Kardex Emergencia", id: window.location.hostname },
          user: { id: userId, name: user?.email, displayName: `${datosDoctor.nombre} ${datosDoctor.apellido}`.trim() || 'Doctor' },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "required", requireResidentKey: true },
          timeout: 60000,
        }
      });

      localStorage.setItem('huellaActivada', 'true');
      localStorage.setItem('kardex_cred_name', `${datosDoctor.nombre} ${datosDoctor.apellido}`.trim()); 
      localStorage.setItem('kardex_cred_especialidad', datosDoctor.especialidad); 
      localStorage.setItem('kardex_cred_email', user?.email || ''); 
      localStorage.removeItem('quiereHuella');
      setTieneHuella(true);
      setMostrarModalHuellaGlobal(false);
    } catch (error) {
      setMensajeHuella({ tipo: 'error', texto: 'Registro cancelado o no compatible.' });
      setTimeout(() => setMensajeHuella({ tipo: '', texto: '' }), 3000);
    }
  };

  const quitarHuellaGlobal = () => {
    localStorage.removeItem('huellaActivada');
    localStorage.removeItem('kardex_cred_name');
    localStorage.removeItem('kardex_cred_email');
    localStorage.removeItem('kardex_cred_especialidad');
    localStorage.removeItem('kardex_cred');
    setTieneHuella(false);
  };

  const rechazarHuellaGlobal = () => {
    localStorage.removeItem('quiereHuella');
    setMostrarModalHuellaGlobal(false);
  };

  const handleCerrarSesion = async () => {
    sessionStorage.removeItem('sesionActiva');
    await supabase.auth.signOut();
    window.location.reload();
  };

  const cambiarVista = (vista) => {
    setVistaActiva(vista);
    setMenuAbierto(false);
  };

  // ¡AQUÍ ESTÁ LA FUNCIÓN QUE FALTABA!
  const actualizarDatosGlobales = (nuevosDatos) => {
    setDatosDoctor(nuevosDatos);
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#070b14] text-white font-sans overflow-hidden relative">
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      {mostrarModalHuellaGlobal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#070b14]/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#141824] border border-white/10 p-6 rounded-3xl shadow-2xl max-w-xs w-full flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-5">
              <svg className="w-7 h-7 text-[#070b14]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Activar Seguridad</h2>
            
            {mensajeHuella.texto ? (
              <p className="text-red-400 text-xs mb-6 font-medium bg-red-500/10 py-1.5 px-3 rounded-lg">{mensajeHuella.texto}</p>
            ) : (
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">¿Deseas usar tu huella dactilar para iniciar sesión rápidamente la próxima vez?</p>
            )}

            <div className="w-full flex flex-col gap-2">
              <button onClick={registrarHuellaGlobal} className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl text-slate-900 font-bold hover:opacity-90 transition text-sm shadow-lg shadow-blue-500/20">Sí, activar ahora</button>
              <button onClick={rechazarHuellaGlobal} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition text-sm">No, gracias</button>
            </div>
          </div>
        </div>
      )}

      {menuAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMenuAbierto(false)}></div>
      )}

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
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Configuración
          </button>

          <div className="pt-4 pb-1">
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Comunicaciones</p>
          </div>

          <button onClick={() => cambiarVista('chat')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${vistaActiva === 'chat' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            Chat Global <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          </button>

          <div className="pt-4 pb-1">
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Módulos Médicos</p>
          </div>

          <button onClick={() => cambiarVista('pacientes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${vistaActiva === 'pacientes' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Pacientes
          </button>

          <button onClick={() => cambiarVista('kardex')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${vistaActiva === 'kardex' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            Historial Médico
          </button>

          <button onClick={() => cambiarVista('agenda')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${vistaActiva === 'agenda' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Agenda de Citas
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
              {vistaActiva === 'kardex' ? 'Historial Médico' : vistaActiva}
            </h2>
            <span className="text-slate-400 text-xs">
              {vistaActiva === 'chat' ? 'Comunicación en tiempo real' : 'Gestión de tu panel médico'}
            </span>
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
          {vistaActiva === 'inicio' && <VistaInicio doctor={datosDoctor} />}
          {vistaActiva === 'perfil' && <VistaPerfil user={user} onActualizar={actualizarDatosGlobales} />}
          {vistaActiva === 'configuracion' && <VistaConfiguracion tieneHuella={tieneHuella} registrarHuellaGlobal={registrarHuellaGlobal} quitarHuellaGlobal={quitarHuellaGlobal} permisoNotificaciones={permisoNotificaciones} setPermisoNotificaciones={setPermisoNotificaciones} />}
          {vistaActiva === 'chat' && <VistaChat user={user} doctor={datosDoctor} />}
          
          {vistaActiva === 'pacientes' && <VistaEnDesarrollo titulo="Gestión de Pacientes" />}
          {vistaActiva === 'kardex' && <VistaEnDesarrollo titulo="Historial Médico (Kardex)" />}
          {vistaActiva === 'agenda' && <VistaEnDesarrollo titulo="Agenda de Citas" />}
        </main>
      </div>
    </div>
  );
}

// ==========================================
// SUB-COMPONENTE: CHAT GLOBAL 
// ==========================================
function VistaChat({ user, doctor }) {
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

  useEffect(() => {
    const cargarMensajes = async () => {
      const { data } = await supabase
        .from('mensajes')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (data) setMensajes(data);
    };

    cargarMensajes();

    const canal = supabase
      .channel('public:mensajes-ui')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, (payload) => {
        setMensajes((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  useEffect(() => {
    hacerScrollAlFondo();
  }, [mensajes]);

  const enviarMensaje = async (e) => {
    if (e) e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    const msjTexto = nuevoMensaje;
    setNuevoMensaje('');

    await supabase.from('mensajes').insert([{
      user_id: user.id,
      nombre_doctor: `Dr(a). ${doctor.nombre} ${doctor.apellido}`.trim() || 'Doctor',
      texto: msjTexto
    }]);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#141824] sm:rounded-3xl border-x sm:border border-white/10 overflow-hidden shadow-2xl relative">
      <div className="h-16 bg-[#0a0d16]/80 backdrop-blur-md border-b border-white/5 flex items-center px-6 shrink-0 z-10">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-3"></div>
        <h3 className="font-bold text-white">Canal de Emergencias</h3>
        <span className="ml-auto text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-md">Todos los doctores</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[url('/imge.jpg')] bg-cover bg-center bg-blend-overlay bg-[#070b14]/95 scroll-smooth">
        {mensajes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p>No hay mensajes aún. Inicia la comunicación.</p>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {mensajes.map((msj) => {
              const esMio = msj.user_id === user.id;
              return (
                <div key={msj.id} className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}>
                  <span className={`text-[11px] font-medium mb-1 ${esMio ? 'text-cyan-400 mr-2' : 'text-slate-400 ml-2'}`}>
                    {esMio ? 'Tú' : msj.nombre_doctor}
                  </span>
                  
                  <div className={`px-4 py-2.5 max-w-[85%] sm:max-w-[70%] rounded-2xl ${
                    esMio 
                      ? 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white rounded-br-sm shadow-md' 
                      : 'bg-[#1a2035] text-slate-200 border border-white/5 rounded-bl-sm shadow-md'
                  }`}>
                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msj.texto}</p>
                  </div>
                  <span className={`text-[9px] text-slate-500 mt-1 ${esMio ? 'mr-2' : 'ml-2'}`}>
                    {new Date(msj.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
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
            <button
              key={i}
              type="button"
              onClick={() => setNuevoMensaje(sug)}
              className="shrink-0 bg-[#141824] border border-white/10 hover:bg-white/10 text-cyan-400/80 hover:text-cyan-300 text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
            >
              {sug}
            </button>
          ))}
        </div>

        <form onSubmit={enviarMensaje} className="px-4 pb-4 sm:px-6">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Escribe un reporte o solicitud..."
              className="flex-1 bg-[#141824] border border-white/10 rounded-full px-5 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button 
              type="submit"
              disabled={!nuevoMensaje.trim()}
              className="w-11 h-11 rounded-full bg-cyan-500 flex items-center justify-center text-slate-900 hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// SUB-COMPONENTE: VISTA INICIO
// ==========================================
function VistaInicio({ doctor }) {
  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-[#141824] to-[#0a0d16] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none"></div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">¡Bienvenido de vuelta, {doctor.nombre} {doctor.apellido}!</h1>
        <p className="text-cyan-400 font-medium text-sm">{doctor.especialidad}</p>
      </div>
    </div>
  );
}

// ==========================================
// SUB-COMPONENTE: MÓDULOS EN DESARROLLO
// ==========================================
function VistaEnDesarrollo({ titulo }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in text-center">
      <div className="w-20 h-20 bg-[#141824] border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-lg">
        <svg className="w-10 h-10 text-cyan-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">{titulo}</h2>
      <span className="text-cyan-400 text-[10px] uppercase tracking-widest font-bold px-4 py-1.5 bg-cyan-400/10 rounded-lg">
        App en desarrollo
      </span>
    </div>
  );
}

// ==========================================
// SUB-COMPONENTE: VISTA PERFIL
// ==========================================
function VistaPerfil({ user, onActualizar }) {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cedula, setCedula] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const { data, error } = await supabase.from('doctores')
          .select('*')
          .eq('id', user.id).single();
          
        if (error) throw error;

        if (data) {
          setNombre(data.nombre || '');
          setApellido(data.apellido || '');
          setCedula(data.cedula || '');
          setEspecialidad(data.especialidad || '');
          setTelefono(data.telefono || '');
          setCiudad(data.ciudad || ''); 
        }
      } catch (err) {
        console.error("Error al cargar datos:", err);
      }
    };
    cargarPerfil();
  }, [user]);

  const handleActualizar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const { error: errorDB } = await supabase.from('doctores')
        .update({ nombre, apellido, cedula, especialidad, telefono, ciudad })
        .eq('id', user.id);
      if (errorDB) throw errorDB;

      if (password) {
        if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
        const { error: errorAuth } = await supabase.auth.updateUser({ password });
        if (errorAuth) throw errorAuth;
      }

      if (email !== user.email) {
        const { error: errorEmail } = await supabase.auth.updateUser({ email });
        if (errorEmail) throw errorEmail;
        setMensaje({ tipo: 'exito', texto: 'Perfil guardado. Revisa tu correo antiguo y nuevo para confirmar el cambio.' });
      } else {
        setMensaje({ tipo: 'exito', texto: '¡Tus datos han sido actualizados exitosamente!' });
      }

      onActualizar({
        nombre: nombre.split(' ')[0],
        apellido: apellido.split(' ')[0],
        especialidad: especialidad
      });
      
      const tieneHuella = localStorage.getItem('huellaActivada') === 'true';
      if (tieneHuella) {
         localStorage.setItem('kardex_cred_name', `${nombre.split(' ')[0]} ${apellido.split(' ')[0]}`);
         localStorage.setItem('kardex_cred_especialidad', especialidad);
      }

      setPassword('');
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'Error al actualizar.' });
    } finally {
      setLoading(false);
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in w-full pb-10">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Datos Personales y Profesionales</h2>
      
      {mensaje.texto && (
        <div className={`mb-6 px-5 py-4 rounded-2xl border transition-all ${mensaje.tipo === 'error' ? 'bg-red-900/40 border-red-500/50 text-red-200' : 'bg-green-900/40 border-green-500/50 text-green-200'}`}>
          <p className="text-sm font-medium">{mensaje.texto}</p>
        </div>
      )}

      <form onSubmit={handleActualizar} className="bg-[#141824] p-5 sm:p-8 rounded-3xl border border-white/10 shadow-xl flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Nombres</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
              className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Apellidos</label>
            <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} required
              className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Cédula</label>
            <input type="text" value={cedula} onChange={(e) => setCedula(e.target.value)} required
              className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Teléfono (+58)</label>
            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej. 04241234567"
              className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Ciudad</label>
            <input type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Ej. Punto Fijo"
              className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Especialidad Médica</label>
          <select value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} required
            className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none text-sm">
            <option value="" disabled>Selecciona una especialidad...</option>
            <option value="Cardiología">Cardiología</option>
            <option value="Pediatría">Pediatría</option>
            <option value="Medicina General">Medicina General</option>
            <option value="Cirugía">Cirugía</option>
            <option value="Traumatología">Traumatología</option>
          </select>
        </div>

        <div className="border-t border-white/5 my-1"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Correo Electrónico (Login)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Nueva Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Dejar en blanco para no cambiar"
              className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-600 text-sm" />
          </div>
        </div>

        <div className="border-t border-white/5 mt-2 pt-5 flex justify-end">
          <button type="submit" disabled={loading} className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl text-slate-900 font-bold hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">
            {loading ? 'Guardando...' : 'Guardar Perfil'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ==========================================
// SUB-COMPONENTE: VISTA CONFIGURACIÓN 
// ==========================================
function VistaConfiguracion({ tieneHuella, registrarHuellaGlobal, quitarHuellaGlobal, permisoNotificaciones, setPermisoNotificaciones }) {
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const solicitarNotificacionesManual = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then(perm => {
        setPermisoNotificaciones(perm);
        if (perm === 'granted') {
          setMensaje({ tipo: 'exito', texto: '¡Notificaciones activadas!' });
        } else {
          setMensaje({ tipo: 'error', texto: 'Permiso denegado por el navegador.' });
        }
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in relative pb-10">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">Seguridad y Acceso</h2>
      
      {mensaje.texto && (
        <div className={`mb-5 px-4 py-3 rounded-xl border transition-all ${mensaje.tipo === 'error' ? 'bg-red-900/40 border-red-500/50 text-red-200' : 'bg-green-900/40 border-green-500/50 text-green-200'}`}>
          <p className="text-sm font-medium">{mensaje.texto}</p>
        </div>
      )}

      {/* Tarjeta Notificaciones */}
      <div className="bg-[#141824] p-5 rounded-2xl border border-white/10 shadow-md flex flex-col sm:flex-row items-center sm:justify-between gap-4 mb-5">
        <div className="flex items-center gap-4 w-full">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${permisoNotificaciones === 'granted' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </div>
          <div className="text-left">
            <h3 className="text-base font-bold text-white mb-0.5">Alertas de Emergencia</h3>
            <p className="text-slate-400 text-xs max-w-xs leading-relaxed">Recibe sonido y notificación nativa cuando hay una emergencia en el chat global.</p>
          </div>
        </div>
        <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
          {permisoNotificaciones === 'granted' ? (
            <span className="text-blue-400 text-sm font-bold bg-blue-500/10 px-4 py-2 rounded-xl inline-block text-center w-full sm:w-auto">Activadas</span>
          ) : (
            <button onClick={solicitarNotificacionesManual} className="w-full sm:w-auto px-5 py-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-xl font-semibold transition-all text-sm">
              Activar Alertas
            </button>
          )}
        </div>
      </div>

      {/* Tarjeta Huella */}
      <div className="bg-[#141824] p-5 rounded-2xl border border-white/10 shadow-md flex flex-col sm:flex-row items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 w-full">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${tieneHuella ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
          </div>
          <div className="text-left">
            <h3 className="text-base font-bold text-white mb-0.5">Ingreso Biométrico</h3>
            <p className="text-slate-400 text-xs max-w-xs leading-relaxed">Usa tu huella dactilar para iniciar sesión más rápido y evitar escribir contraseñas.</p>
          </div>
        </div>
        
        <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
          {!tieneHuella ? (
            <button onClick={registrarHuellaGlobal} className="w-full sm:w-auto px-5 py-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 rounded-xl font-semibold transition-all text-sm">
              Activar Huella
            </button>
          ) : (
            <button onClick={quitarHuellaGlobal} className="w-full sm:w-auto px-5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl font-semibold transition-all text-sm">
              Desactivar Huella
            </button>
          )}
        </div>
      </div>
    </div>
  );
}