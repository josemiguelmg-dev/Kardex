import { useState } from 'react';

export default function Configuracion({ permisoNotificaciones, setPermisoNotificaciones, user, doctor }) {
  const [tieneHuella, setTieneHuella] = useState(localStorage.getItem('huellaActivada') === 'true');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const registrarHuellaGlobal = async () => {
    try {
      const challenge = new Uint8Array(32); window.crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16); window.crypto.getRandomValues(userId);
      await navigator.credentials.create({
        publicKey: {
          challenge, rp: { name: "Kardex", id: window.location.hostname },
          user: { id: userId, name: user?.email, displayName: `${doctor.nombre} ${doctor.apellido}` },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "required", requireResidentKey: true },
          timeout: 60000,
        }
      });
      localStorage.setItem('huellaActivada', 'true'); setTieneHuella(true); setMensaje({ tipo: 'exito', texto: '¡Huella dactilar activada correctamente!' });
    } catch { setMensaje({ tipo: 'error', texto: 'El registro biométrico fue cancelado o no es compatible.' }); } finally { setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000); }
  };

  const quitarHuellaGlobal = () => { localStorage.removeItem('huellaActivada'); setTieneHuella(false); setMensaje({ tipo: 'exito', texto: 'Huella eliminada del sistema.' }); setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000); };
  
  const solicitarNotificacionesManual = () => { 
    if (!("Notification" in window)) {
      setMensaje({ tipo: 'error', texto: 'Este navegador no soporta notificaciones.' });
      return;
    }
    if (Notification.permission === 'denied') {
      setMensaje({ tipo: 'error', texto: 'Bloqueado. Toca el candado 🔒 en la barra de URL arriba y pon "Permitir Notificaciones".' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 6000);
      return;
    }
    Notification.requestPermission().then(perm => {
      setPermisoNotificaciones(perm);
      if (perm === 'granted') {
        setMensaje({ tipo: 'exito', texto: '¡Notificaciones activadas!' });
      } else {
        setMensaje({ tipo: 'error', texto: 'Permiso denegado por el navegador.' });
      }
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
    });
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in relative pb-10">
      
      {/* Banner Superior con Imagen */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#141824] to-[#0a0d16] p-6 sm:p-8 rounded-[2rem] border border-white/5 shadow-xl mb-6 sm:mb-8 relative overflow-hidden h-36 sm:h-40">
        <div className="absolute top-[-50%] right-[-10%] w-48 h-48 bg-blue-500/10 blur-[50px] rounded-full"></div>
        <div className="z-10">
          <h2 className="text-xl sm:text-3xl font-bold text-white mb-1">Seguridad</h2>
          <p className="text-slate-400 text-xs sm:text-sm">Configura tus notificaciones y biometría.</p>
        </div>
        
        {/* 👇 AQUÍ LLAMAS A TU IMAGEN DE CONFIGURACIÓN 👇 */}
        <img 
          src="/confirme.svg" 
          alt="Ilustración Seguridad" 
          className="absolute -right-4 -bottom-6 w-40 sm:w-56 h-auto drop-shadow-2xl z-10" 
        />
        {/* 👆 ----------------------------------------- 👆 */}
      </div>

      {mensaje.texto && (
        <div className={`mb-6 px-5 py-4 rounded-2xl border transition-all ${mensaje.tipo === 'error' ? 'bg-red-900/40 border-red-500/50 text-red-200' : 'bg-green-900/40 border-green-500/50 text-green-200'}`}>
          <p className="text-sm font-medium">{mensaje.texto}</p>
        </div>
      )}

      <div className="bg-[#141824] p-5 sm:p-6 rounded-[2rem] border border-white/10 shadow-xl flex flex-col gap-4">
        
        {/* Tarjeta Notificaciones */}
        <div className="bg-[#0a0d16] p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 w-full">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${permisoNotificaciones === 'granted' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
            <div className="text-left">
              <h3 className="text-base font-bold text-white mb-0.5">Alertas de Emergencia</h3>
              <p className="text-slate-400 text-xs sm:text-sm">Recibe sonido y notificación nativa en el chat.</p>
            </div>
          </div>
          <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
            {permisoNotificaciones === 'granted' ? (
              <span className="text-blue-400 text-sm font-bold bg-blue-500/10 px-5 py-2.5 rounded-xl block text-center border border-blue-500/20 w-full sm:w-auto">Activadas</span>
            ) : (
              <button onClick={solicitarNotificacionesManual} className="w-full sm:w-auto px-6 py-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-xl font-semibold transition-all text-sm">
                Activar Alertas
              </button>
            )}
          </div>
        </div>

        {/* Tarjeta Huella */}
        <div className="bg-[#0a0d16] p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 w-full">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${tieneHuella ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
            </div>
            <div className="text-left">
              <h3 className="text-base font-bold text-white mb-0.5">Ingreso Biométrico</h3>
              <p className="text-slate-400 text-xs sm:text-sm">Usa tu huella para iniciar sesión rápidamente.</p>
            </div>
          </div>
          <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
            {!tieneHuella ? (
              <button onClick={registrarHuellaGlobal} className="w-full sm:w-auto px-6 py-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 rounded-xl font-semibold transition-all text-sm">
                Activar Huella
              </button>
            ) : (
              <button onClick={quitarHuellaGlobal} className="w-full sm:w-auto px-6 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl font-semibold transition-all text-sm">
                Desactivar Huella
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}