import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient.js';

export default function RegistroCorreo({ irALogin, onVerificado }) {
  const [paso, setPaso] = useState(1); 
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    if (mensaje.texto) {
      const timer = setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  // Verificar si el usuario volvió de Google y ya existía
  useEffect(() => {
    const verificarGoogleUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const user = session.user;
        const fechaCreacion = new Date(user.created_at).getTime();
        const ahora = Date.now();

        if (ahora - fechaCreacion > 10000) {
          await supabase.auth.signOut();
          setMensaje({ 
            tipo: 'error', 
            texto: 'Este correo ya existe. Por favor, inicia sesión.' 
          });
          
          setTimeout(() => {
            irALogin();
          }, 2500);
        } else {
          onVerificado(user);
        }
      }
    };
    verificarGoogleUser();
  }, [irALogin, onVerificado]);

  const handleGoogleRegister = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error al conectar con Google.' });
    }
  };

  // PASO 1: Enviar correo y cambiar a la pantalla del código
  const handleEnviarCodigo = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    setLoading(true);

    try {
      const emailTrimmed = email.toLowerCase().trim();
      
      const { error } = await supabase.auth.signInWithOtp({
        email: emailTrimmed,
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) throw error;

      // Cambiamos al paso 2 para mostrar el input del código
      setPaso(2);
      setMensaje({ tipo: 'exito', texto: '¡Código enviado a tu correo!' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'Error al procesar el registro.' });
    } finally {
      setLoading(false);
    }
  };

  // PASO 2: Verificar el código de 6 dígitos que envió Supabase
  const handleVerificarCodigo = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: codigo.trim(),
        type: 'email', // Cambiado a 'email' para asegurar compatibilidad total en producción con Vercel
      });

      if (error) throw error;

      if (data?.user) {
        onVerificado(data.user);
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'El código es incorrecto o ha expirado.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {mensaje.texto && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 px-5 py-4 rounded-xl border shadow-2xl transition-all duration-300 animate-fade-in ${
          mensaje.tipo === 'error' ? 'bg-red-900/95 border-red-500/50 text-red-100' : 'bg-green-900/95 border-green-500/50 text-green-100'
        }`}>
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{mensaje.texto}</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-[380px] z-10 flex flex-col pt-2">
        <div className="animate-fade-in flex flex-col">
          
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/20">
                <span className="text-[#070b14] font-black text-sm">KE</span>
              </div>
              <h2 className="text-3xl font-bold text-white tracking-wide">
                Kardex
              </h2>
            </div>
            
            <h1 className="text-white text-3xl font-bold mb-2">
              {paso === 1 ? 'Crear Cuenta' : 'Verificar Código'}
            </h1>
            <p className="text-slate-400 text-sm px-4">
              {paso === 1 
                ? 'Para crear una cuenta proporciona tu correo y verifícalo.' 
                : 'Ingresa el código que enviamos a tu correo electrónico.'}
            </p>
          </div>

          {paso === 1 ? (
            <>
              <button 
                onClick={handleGoogleRegister}
                type="button"
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-[#141824] border border-white/10 hover:bg-white/5 rounded-2xl text-white font-medium text-sm transition-all shadow-inner mb-6"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuar con Google
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-slate-500 text-xs font-medium uppercase">O</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              <form onSubmit={handleEnviarCodigo} className="flex flex-col gap-4">
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

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl text-slate-900 font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-blue-500/20"
                >
                  {loading ? 'Enviando...' : 'Continuar'}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleVerificarCodigo} className="flex flex-col gap-4 animate-fade-in">
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-5 py-4 bg-[#141824]/50 border border-white/5 rounded-2xl text-slate-500 text-sm cursor-not-allowed shadow-inner"
              />

              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
                maxLength={6}
                className="w-full px-5 py-4 bg-[#141824] border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm tracking-widest text-center focus:outline-none focus:border-blue-500/70 transition-all shadow-inner"
                placeholder="CÓDIGO DE 6 DÍGITOS"
              />

              <button
                type="submit"
                disabled={loading || !codigo}
                className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl text-slate-900 font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>

              <button
                type="button"
                onClick={() => setPaso(1)}
                className="text-slate-400 text-sm hover:text-white transition-colors text-center mt-2"
              >
                ← Cambiar correo electrónico
              </button>
            </form>
          )}

          <div className="mt-8 flex flex-col items-center gap-6">
            <p className="text-slate-400 text-sm">
              ¿Ya tienes una cuenta?{' '}
              <button onClick={irALogin} className="text-white font-semibold hover:text-cyan-300 transition-colors">
                Inicia Sesión
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