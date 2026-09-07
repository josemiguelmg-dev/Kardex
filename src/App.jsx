import { useState, useEffect } from 'react';
import RegistroCorreo from './components/auth/RegistroCorreo.jsx';
import CompletarRegistro from './components/auth/CompletarRegistro.jsx';
import Login from './components/auth/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import RecuperarPassword from './components/auth/RecuperarPassword.jsx';
import RestablecerClave from './components/auth/RestablecerPassword.jsx'; 
import { supabase } from './services/supabaseClient.js';

export default function App() {
  const [usuarioActivo, setUsuarioActivo] = useState(null);
  const [perfilCompleto, setPerfilCompleto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [vistaInicial, setVistaInicial] = useState('login'); 
  const [emailRecuperacion, setEmailRecuperacion] = useState(''); 

  const verificarEstadoDelPerfil = async (user) => {
    if (!user) return;
    const { data } = await supabase.from('doctores').select('id').eq('id', user.id).maybeSingle();
    setPerfilCompleto(!!data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const quiereRecordar = localStorage.getItem('recordarme') !== 'false';
        const esMismaPestana = sessionStorage.getItem('sesionActiva') === 'true';

        if (!quiereRecordar && !esMismaPestana) {
          await supabase.auth.signOut();
          setUsuarioActivo(null);
          setCargando(false);
          return;
        }

        setUsuarioActivo(session.user);
        await verificarEstadoDelPerfil(session.user);
        setCargando(false);
      } else {
        setCargando(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUsuarioActivo(session?.user ?? null);
      if (session?.user) await verificarEstadoDelPerfil(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // AQUÍ ESTÁ EL CAMBIO CLAVE: Si estamos restableciendo, no saltamos al Dashboard
  if (usuarioActivo && perfilCompleto && vistaInicial !== 'restablecer') {
    return <Dashboard user={usuarioActivo} />;
  }

  return (
    <div className="min-h-screen bg-[#070b14]/85 bg-[url('/imge.jpg')] bg-blend-overlay bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none"></div>

      {!usuarioActivo || vistaInicial === 'restablecer' ? (
        vistaInicial === 'login' ? (
          <Login 
            irARegistro={() => setVistaInicial('registro')} 
            irARecuperar={() => setVistaInicial('recuperar')}
            onLoginExitoso={(user) => setUsuarioActivo(user)} 
          />
        ) : vistaInicial === 'registro' ? (
          <RegistroCorreo 
            irALogin={() => setVistaInicial('login')} 
            onVerificado={(user) => setUsuarioActivo(user)} 
          />
        ) : vistaInicial === 'recuperar' ? (
          <RecuperarPassword 
            irALogin={() => setVistaInicial('login')}
            irARestablecer={(email) => {
              setEmailRecuperacion(email);
              setVistaInicial('restablecer');
            }} 
          />
        ) : (
          <RestablecerClave 
            volverALogin={() => setVistaInicial('login')}
            emailInicial={emailRecuperacion} 
          />
        )
      ) : (
        <CompletarRegistro user={usuarioActivo} />
      )}
    </div>
  );
}