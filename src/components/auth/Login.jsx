import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient.js';

export default function Login({ irARegistro, irARecuperar, onLoginExitoso }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recordarme, setRecordarme] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  // --- NUEVOS ESTADOS PARA LA HUELLA ---
  const [mostrarPromptHuella, setMostrarPromptHuella] = useState(false);
  const [usuarioTemp, setUsuarioTemp] = useState(null);
  const huellaActivada = localStorage.getItem('huellaActivada') === 'true';

  useEffect(() => {
    if (mensaje.texto) {
      const timer = setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (error) throw error;

      localStorage.setItem('recordarme', recordarme ? 'true' : 'false');
      if (!recordarme) {
        sessionStorage.setItem('sesionActiva', 'true'); 
      }

      // --- LÓGICA BIOMÉTRICA (INTERCEPCIÓN) ---
      // Si quiere recordar sesión y el dispositivo soporta huella, le preguntamos
      if (recordarme && window.PublicKeyCredential) {
        setUsuarioTemp(data.user);
        setMostrarPromptHuella(true);
        // Guardamos las credenciales temporalmente codificadas para re-autenticar luego con la huella
        localStorage.setItem('kardex_cred', btoa(`${email.toLowerCase().trim()}:${password}`));
      } else {
        onLoginExitoso(data.user);
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Correo o contraseña incorrectos.' });
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIÓN PARA REGISTRAR LA HUELLA ---
  const registrarHuella = async () => {
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      // Esto activa el lector de huellas del teléfono/PC
      await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Kardex Emergencia" },
          user: { id: userId, name: usuarioTemp.email, displayName: usuarioTemp.email },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
          timeout: 60000,
        }
      });

      localStorage.setItem('huellaActivada', 'true');
      setMensaje({ tipo: 'exito', texto: '¡Huella configurada con éxito!' });
      
      setTimeout(() => {
        onLoginExitoso(usuarioTemp);
      }, 1500);

    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Registro cancelado o dispositivo no compatible.' });
      setTimeout(() => onLoginExitoso(usuarioTemp), 2000);
    }
  };

  // --- FUNCIÓN PARA INICIAR SESIÓN CON HUELLA ---
  const loginConHuella = async () => {
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Pide la huella
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required"
        }
      });

      // Si la huella es correcta, iniciamos sesión invisiblemente
      const creds = localStorage.getItem('kardex_cred');
      if (creds) {
        setLoading(true);
        const [savedEmail, savedPass] = atob(creds).split(':');
        const { data, error } = await supabase.auth.signInWithPassword({ email: savedEmail, password: savedPass });
        if (error) throw error;
        onLoginExitoso(data.user);
      } else {
        setMensaje({ tipo: 'error', texto: 'No se encontraron credenciales. Usa tu contraseña.' });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Huella no reconocida o cancelada.' });
    } finally {
      setLoading(false);
    }
  };

  // --- PANTALLA INTERMEDIA DE CONFIGURACIÓN DE HUELLA ---
  if (mostrarPromptHuella) {
    return (
      <div className="w-full max-w-[380px] z-10 flex flex-col pt-2 animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <svg className="w-8 h-8 text-[#070b14]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
          </div>
          <h1 className="text-white text-2xl font-bold mb-3">Seguridad Biométrica</h1>
          <p className="text-slate-400 text-sm px-2 leading-relaxed">
            ¿Deseas usar tu huella dactilar o FaceID para iniciar sesión más rápido la próxima vez?
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={registrarHuella} className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl text-slate-900 font-bold text-base hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20">
            Sí, configurar ahora
          </button>
          <button onClick={() => onLoginExitoso(usuarioTemp)} className="w-full py-4 bg-[#141824] border border-white/10 rounded-2xl text-white font-medium text-sm hover:bg-white/5 transition-all">
            No, quizás más tarde
          </button>
        </div>
      </div>
    );
  }

  // --- PANTALLA DE LOGIN NORMAL ---
  return (
    <>
      {mensaje.texto && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 px-5 py-4 rounded-xl border shadow-2xl transition-all duration-300 animate-fade-in ${
          mensaje.tipo === 'error' ? 'bg-red-900/95 border-red-500/50 text-red-100' : 'bg-green-900/95 border-green-500/50 text-green-100'
        }`}>
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm font-medium">{mensaje.texto}</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-[380px] z-10 flex flex-col pt-2">
        <div className="animate-fade-in flex flex-col">
          
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-15">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/20">
                <span className="text-[#070b14] font-black text-sm">KE</span>
              </div>
              <h2 className="text-3xl font-bold text-white tracking-wide">
                Kardex
              </h2>
            </div>
            
            <h1 className="text-white text-3xl font-bold mb-2">Inicia sesión para continuar</h1>
            <p className="text-slate-400 text-sm px-4">
              Por favor ingresa tus datos para entrar.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            
            {/* BOTÓN DE LOGIN CON HUELLA (Aparece solo si el usuario lo configuró previamente) */}
            {huellaActivada && (
              <button 
                type="button" 
                onClick={loginConHuella}
                className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-cyan-900/20 border border-cyan-500/30 hover:bg-cyan-900/40 rounded-2xl text-cyan-400 font-semibold text-sm transition-all shadow-inner mb-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
                Ingresar con Huella Dactilar
              </button>
            )}

            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-4 bg-[#141824] border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/70 transition-all shadow-inner"
              placeholder="Correo electrónico"
            />
            
            <div className="flex flex-col gap-2">
              <div className="relative">
                <input 
                  type={mostrarPassword ? "text" : "password"} 
                  name="password"
                  autoComplete="current-password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                  className="w-full px-5 py-4 bg-[#141824] border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner" 
                  placeholder="Contraseña" 
                />
                <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {mostrarPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 015.002-5.414m2.59-1.02A10.01 10.01 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-2.458 3.864m-4.242-4.242a3 3 0 014.242 4.242M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
              
              <div className="flex justify-end mt-1">
                <button type="button" onClick={irARecuperar} className="text-slate-400 hover:text-white text-xs transition-colors cursor-pointer">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <input 
                type="checkbox" 
                id="recordarme" 
                checked={recordarme}
                onChange={(e) => setRecordarme(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 bg-[#141824] border-white/20 rounded cursor-pointer"
              />
              <label htmlFor="recordarme" className="text-slate-400 text-sm cursor-pointer select-none">
                Mantener sesión iniciada
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl text-slate-900 font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              {loading ? 'Entrando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-6">
            <p className="text-slate-400 text-sm">
              ¿No tienes una cuenta?{' '}
              <button onClick={irARegistro} className="text-white font-semibold hover:text-cyan-300 transition-colors">
                Regístrate
              </button>
            </p>
            
            <p className="text-slate-600 text-[10px] uppercase tracking-wider">
              Términos de Servicio | Política de Privacidad
            </p>
          </div>

        </div>
      </div>
    </>
  );
}