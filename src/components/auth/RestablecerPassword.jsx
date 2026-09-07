import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient.js';

export default function RestablecerClave({ volverALogin, emailInicial = '' }) {
  // Estado para controlar en qué paso estamos (1: Código, 2: Nueva Contraseña)
  const [paso, setPaso] = useState(1); 
  
  const [email, setEmail] = useState(emailInicial);
  const [codigo, setCodigo] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Limpiar el mensaje de error/éxito después de 4 segundos
  useEffect(() => {
    if (mensaje.texto) {
      const timer = setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  // --- PASO 1: VERIFICAR EL CÓDIGO ---
  const handleVerificarCodigo = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    setLoading(true);

    try {
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: codigo,
        type: 'recovery',
      });

      if (otpError) throw new Error('El código es incorrecto o ha expirado.');

      // Si el código es correcto, Supabase inicia una sesión de recuperación por debajo.
      // Pasamos al paso 2
      setPaso(2);
      setMensaje({ tipo: 'exito', texto: 'Código verificado. Ingresa tu nueva contraseña.' });

    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- PASO 2: ACTUALIZAR LA CONTRASEÑA ---
  const handleActualizarPassword = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    if (nuevaPassword !== confirmarPassword) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
      return;
    }

    if (nuevaPassword.length < 6) {
      setMensaje({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: nuevaPassword,
      });

      if (updateError) throw new Error('Hubo un error al actualizar la contraseña.');

      setMensaje({ tipo: 'exito', texto: '¡Contraseña actualizada con éxito!' });
      
      // Cerramos la sesión de recuperación para obligarlo a loguearse normal
      await supabase.auth.signOut();

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        volverALogin();
      }, 2000);

    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
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
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center shadow-lg shadow-white/20">
                <span className="text-[#070b14] font-black text-xs">KE</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">Kardex</h2>
            </div>
            
            <h1 className="text-white text-3xl font-bold mb-2">
              {paso === 1 ? 'Verificar Código' : 'Nueva Contraseña'}
            </h1>
            <p className="text-slate-400 text-sm px-4">
              {paso === 1 
                ? 'Ingresa el código de 6 dígitos que enviamos a tu correo.' 
                : 'Crea una nueva contraseña segura para tu cuenta.'}
            </p>
          </div>

          {/* RENDERIZADO CONDICIONAL DEPENDIENDO DEL PASO */}
          {paso === 1 ? (
            
            /* FORMULARIO PASO 1: VALIDAR CÓDIGO */
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
                maxLength={8}
                className="w-full px-5 py-4 bg-[#141824] border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm tracking-widest text-center focus:outline-none focus:border-blue-500/70 transition-all shadow-inner"
                placeholder="CÓDIGO DE 8 DÍGITOS"
              />

              <button
                type="submit"
                disabled={loading || !codigo || codigo.length < 6}
                className="w-full py-4 mt-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl text-slate-900 font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>
            </form>

          ) : (

            /* FORMULARIO PASO 2: CAMBIAR CONTRASEÑA */
            <form onSubmit={handleActualizarPassword} className="flex flex-col gap-4 animate-fade-in">
              <div className="relative">
                <input 
                  type={mostrarPassword ? "text" : "password"} 
                  value={nuevaPassword} 
                  onChange={(e) => setNuevaPassword(e.target.value)} 
                  required
                  className="w-full px-5 py-4 bg-[#141824] border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner" 
                  placeholder="Nueva Contraseña" 
                />
                <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {mostrarPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 015.002-5.414m2.59-1.02A10.01 10.01 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-2.458 3.864m-4.242-4.242a3 3 0 014.242 4.242M3 3l18 18" /></svg>
                  )}
                </button>
              </div>

              <div className="relative mb-2">
                <input 
                  type={mostrarPassword ? "text" : "password"} 
                  value={confirmarPassword} 
                  onChange={(e) => setConfirmarPassword(e.target.value)} 
                  required
                  className="w-full px-5 py-4 bg-[#141824] border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner" 
                  placeholder="Confirmar Contraseña" 
                />
              </div>

              <button
                type="submit"
                disabled={loading || !nuevaPassword || !confirmarPassword}
                className="w-full py-4 mt-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl text-slate-900 font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
              </button>
            </form>
          )}

          <div className="mt-8 flex flex-col items-center gap-6">
            <button onClick={volverALogin} className="text-slate-400 text-sm font-semibold hover:text-cyan-300 transition-colors">
              ← Cancelar y Volver
            </button>
          </div>

        </div>
      </div>
    </>
  );
}