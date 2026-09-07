import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient.js';

export default function Dashboard({ user }) {
  const [mostrarModalHuella, setMostrarModalHuella] = useState(false);

  useEffect(() => {
    // Revisamos si el Login dejó la "nota" de que quiere configurar la huella
    const quiereHuella = localStorage.getItem('quiereHuella') === 'true';
    const huellaActivada = localStorage.getItem('huellaActivada') === 'true';
    
    // Si la quiere, no la ha activado aún, y el dispositivo soporta biometría
    if (quiereHuella && !huellaActivada && window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(disponible => {
          if (disponible) {
            setMostrarModalHuella(true);
          } else {
            // Si el PC/teléfono no tiene lector, borramos la nota
            localStorage.removeItem('quiereHuella');
          }
        });
    }
  }, []);

  const registrarHuella = async () => {
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Kardex Emergencia" },
          user: { id: userId, name: user.email, displayName: user.email },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
          timeout: 60000,
        }
      });

      // Éxito: Guardamos que ya tiene la huella y cerramos el modal
      localStorage.setItem('huellaActivada', 'true');
      localStorage.removeItem('quiereHuella');
      setMostrarModalHuella(false);
    } catch (error) {
      console.log('Registro biométrico cancelado');
      localStorage.removeItem('quiereHuella');
      setMostrarModalHuella(false);
    }
  };

  const rechazarHuella = () => {
    localStorage.removeItem('quiereHuella');
    setMostrarModalHuella(false);
  };

  const handleCerrarSesion = async () => {
    localStorage.removeItem('recordarme');
    sessionStorage.removeItem('sesionActiva');
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-white p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* MODAL DE HUELLA DACTILAR */}
      {mostrarModalHuella && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b14]/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#141824] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-6">
              <svg className="w-8 h-8 text-[#070b14]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Activar Seguridad</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              ¿Deseas usar tu huella dactilar o FaceID para iniciar sesión rápidamente la próxima vez?
            </p>
            <div className="w-full flex flex-col gap-3">
              <button onClick={registrarHuella} className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl text-slate-900 font-bold hover:opacity-90 transition shadow-lg shadow-blue-500/20">
                Sí, activar ahora
              </button>
              <button onClick={rechazarHuella} className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition">
                No, gracias
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO NORMAL DEL DASHBOARD */}
      <div className="z-10 bg-[#141824] border border-white/10 p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
          <span className="text-3xl font-bold text-[#070b14]">
            {user?.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">Panel de Control</h1>
        <p className="text-slate-400 mb-8 text-sm">
          Sesión iniciada como: <br/> <span className="text-cyan-400 font-medium">{user?.email}</span>
        </p>

        <button 
          onClick={handleCerrarSesion} 
          className="w-full py-4 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-2xl font-bold text-sm transition-all"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}