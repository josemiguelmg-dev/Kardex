import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient.js';

export default function RecuperarPassword({ irALogin, irARestablecer }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Limpiar el mensaje después de 4 segundos
  useEffect(() => {
    if (mensaje.texto) {
      const timer = setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const handleEnviarCodigo = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    setLoading(true);

    try {
      // Supabase envía el correo con el código de recuperación de 6 dígitos
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim());

      if (error) throw error;

      // Si se envía correctamente, ejecutamos la función para cambiar de pantalla 
      // y le enviamos el email para que ya aparezca lleno en la siguiente vista.
      irARestablecer(email);

    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'No se pudo enviar el código. Verifica que el correo sea correcto.' });
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
            
            <h1 className="text-white text-3xl font-bold mb-2">Recuperar Clave</h1>
            <p className="text-slate-400 text-sm px-4">
              Ingresa tu correo y te enviaremos un código para restablecer tu contraseña.
            </p>
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
              {loading ? 'Enviando...' : 'Enviar Código'}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-6">
            <button onClick={irALogin} type="button" className="text-slate-400 text-sm font-semibold hover:text-cyan-300 transition-colors">
              ← Volver a Iniciar Sesión
            </button>
          </div>

        </div>
      </div>
    </>
  );
}