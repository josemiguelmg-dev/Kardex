import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient.js';

// AQUÍ ESTABA EL ERROR: Faltaba recibir "irARecuperar"
export default function Login({ irARegistro, irARecuperar, onLoginExitoso }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recordarme, setRecordarme] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

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

      onLoginExitoso(data.user);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Correo o contraseña incorrectos.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) setMensaje({ tipo: 'error', texto: 'Error al conectar con Google.' });
  };

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
  <div className="flex items-center justify-center gap-3 mb-6">
    <h2 className="text-4xl font-bold text-white tracking-wide">
      Kardex
    </h2>
  </div>
  
  <h1 className="text-white text-3xl font-bold mb-2">¡Hola de nuevo!</h1>
  <p className="text-slate-400 text-sm px-4">
    Por favor ingresa tus datos para entrar.
  </p>
</div>


          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* SE AÑADIÓ name y autoComplete PARA PERMITIR SELECCIONAR EL CORREO GUARDADO */}
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
                {/* ESTE BOTÓN AHORA SÍ CONTIENE EL EVENTO onClick */}
                <button type="button" onClick={irARecuperar} className="text-slate-400 hover:text-white text-xs transition-colors cursor-pointer">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
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