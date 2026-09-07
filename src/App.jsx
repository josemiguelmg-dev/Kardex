import { useState, useEffect } from 'react';
import RegistroCorreo from './components/auth/RegistroCorreo.jsx';
import CompletarRegistro from './components/auth/CompletarRegistro.jsx';
import Login from './components/auth/Login.jsx';
import Dashboard from './pages/Dashboard.jsx'; 
import { supabase } from './services/supabaseClient.js';
import RecuperarPassword from './components/auth/RecuperarPassword.jsx'; 

export default function App() {
  const [usuarioActivo, setUsuarioActivo] = useState(null);
  const [perfilCompleto, setPerfilCompleto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [verificandoPerfil, setVerificandoPerfil] = useState(false); // ESTADO NUEVO ANTI-PESTAÑEO
  const [vistaInicial, setVistaInicial] = useState('login'); 

  const verificarEstadoDelPerfil = async (user) => {
    if (!user) return;
    setVerificandoPerfil(true); // Bloqueamos la pantalla mientras consulta
    const { data } = await supabase.from('doctores').select('id').eq('id', user.id).maybeSingle();
    setPerfilCompleto(!!data);
    setVerificandoPerfil(false); // Desbloqueamos la pantalla
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
      if (session?.user) {
        setUsuarioActivo(session.user);
        await verificarEstadoDelPerfil(session.user);
      } else {
        setUsuarioActivo(null);
        setPerfilCompleto(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // MIENTRAS ESTÉ CARGANDO O VERIFICANDO EL PERFIL, MOSTRARÁ EL SPINNER (CERO PESTAÑEOS)
  if (cargando || verificandoPerfil) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (usuarioActivo && perfilCompleto) {
    return <Dashboard user={usuarioActivo} />;
  }

  return (
    <div className="min-h-screen bg-[#070b14]/85 bg-[url('/imge.jpg')] bg-blend-overlay bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none"></div>

      {!usuarioActivo ? (
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
        ) : (
          <RecuperarPassword 
            irALogin={() => setVistaInicial('login')} 
          />
        )
      ) : (
        <CompletarRegistro user={usuarioActivo} />
      )}
    </div>
  );
}