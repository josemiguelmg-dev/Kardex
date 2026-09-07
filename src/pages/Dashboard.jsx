import { supabase } from '../services/supabaseClient.js';

export default function Dashboard({ user }) {
  
  const handleCerrarSesion = async () => {
    // Limpiamos la memoria de seguridad y cerramos sesión
    localStorage.removeItem('recordarme');
    sessionStorage.removeItem('sesionActiva');
    await supabase.auth.signOut();
    window.location.reload(); // Recargamos para limpiar toda la app
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      
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
          Cerrar Sesión de Forma Segura
        </button>
      </div>
    </div>
  );
}