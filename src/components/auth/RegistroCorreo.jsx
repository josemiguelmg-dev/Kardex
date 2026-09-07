import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient.js';

export default function RegistroCorreo({ onVerificado, irALogin }) {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    if (mensaje.texto) {
      const timer = setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const handleCodigoChange = (e) => {
    const soloNumeros = e.target.value.replace(/\D/g, '');
    setCodigo(soloNumeros);
  };

  // Login con Google
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) setMensaje({ tipo: 'error', texto: 'Error al conectar con Google.' });
  };

  const handleEnviarCodigo = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    setLoading(true);

    try {
      const { data: existe, error: rpcError } = await supabase.rpc('comprobar_correo_existe', {
        correo_buscar: email.toLowerCase().trim()
      });

      if (rpcError) throw rpcError;

      if (existe) {
        setMensaje({ tipo: 'error', texto: 'Este correo ya existe. Por favor, inicia sesión.' });
        setLoading(false);
        return; 
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
      });

      if (error) throw error;
      
      setMensaje({ tipo: 'exito', texto: 'Código enviado. Revisa tu bandeja.' });
      setPaso(2);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Hubo un error al enviar el código.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarCodigo = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: codigo,
        type: 'email'
      });

      if (error) throw error;
      onVerificado(data.user);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Código incorrecto. Verifica los 8 dígitos.' });
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
            <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm font-medium">{mensaje.texto}</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-[380px] z-10 flex flex-col pt-2">
        {paso === 1 ? (
          <div className="animate-fade-in flex flex-col">
            
            {/* Logo y Encabezado */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center shadow-lg shadow-white/20">
                  <span className="text-[#070b14] font-black text-xs">KE</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Kardex
                </h2>
              </div>
              
              <h1 className="text-white text-3xl font-bold mb-2">Crear Cuenta</h1>
              <p className="text-slate-400 text-sm px-2">
                Para crear una cuenta proporciona tu correo y verifícalo.
              </p>
            </div>

            {/* Botón único de Google (Ancho completo) */}
            <button 
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-[#141824] border border-white/10 hover:bg-white/5 rounded-2xl text-white font-medium text-sm transition-all shadow-inner"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuar con Google
            </button>

            {/* Separador "O" */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-slate-500 text-xs font-medium uppercase">O</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <form onSubmit={handleEnviarCodigo} className="flex flex-col gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-4 bg-[#141824] border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/70 transition-all shadow-inner"
                placeholder="Correo electrónico"
              />
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-4 mt-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl text-slate-900 font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {loading ? 'Enviando...' : 'Continuar'}
              </button>
            </form>

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
        ) : (
          <div className="animate-fade-in flex flex-col">
            <h1 className="text-white text-3xl font-bold text-center mb-3">Verificar Correo</h1>
            <p className="text-slate-400 text-sm text-center mb-8 px-2 leading-relaxed">
              Ingresa el código de 8 dígitos enviado a <br/>
              <span className="font-semibold text-white">{email}</span>
            </p>

            <form onSubmit={handleVerificarCodigo} className="flex flex-col gap-5">
              <input
                type="text"
                value={codigo}
                onChange={handleCodigoChange}
                required
                maxLength="8"
                className="w-full px-4 py-4 bg-[#141824] border border-white/10 rounded-2xl text-white placeholder-slate-500 text-xl text-center tracking-[0.3em] focus:outline-none focus:border-blue-500/70 transition-all shadow-inner font-mono"
                placeholder="00000000"
              />
              <button
                type="submit"
                disabled={loading || codigo.length < 8}
                className="w-full py-4 mt-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl text-slate-900 font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {loading ? 'Confirmando...' : 'Confirmar código'}
              </button>
            </form>

            <button onClick={() => setPaso(1)} className="text-slate-400 text-sm text-center mt-8 hover:text-white transition cursor-pointer">
              ← Volver atrás
            </button>
          </div>
        )}
      </div>
    </>
  );
}