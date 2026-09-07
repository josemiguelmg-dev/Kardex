import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient.js';

export default function CompletarRegistro({ user }) {
  // Configuro mis estados iniciales
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);

  const [perfilData, setPerfilData] = useState({
    nombre: '', 
    apellido: '', 
    cedula: '', 
    especialidad: '', 
    telefono: '', 
    estado: '' 
  });

  // Mi efecto para limpiar los mensajes flotantes a los 4 segundos
  useEffect(() => {
    if (mensaje.texto) {
      const timer = setTimeout(() => {
        setMensaje({ tipo: '', texto: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  // Manejador estricto: SOLO PERMITE LETRAS Y ESPACIOS
  const handleLetrasChange = (e) => {
    const { name, value } = e.target;
    const soloLetras = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    setPerfilData({ ...perfilData, [name]: soloLetras });
  };

  // Manejador estricto: SOLO PERMITE NÚMEROS
  const handleNumerosChange = (e) => {
    const { name, value } = e.target;
    const soloNumeros = value.replace(/\D/g, '');
    setPerfilData({ ...perfilData, [name]: soloNumeros });
  };

  const handlePerfilChange = (e) => {
    setPerfilData({ ...perfilData, [e.target.name]: e.target.value });
  };

  const handleVolver = async () => {
    await supabase.auth.signOut();
  };

  // Función para redirigir al doctor a la aplicación principal
  const irAlSiguienteArchivo = () => {
    // ⚠️ ATENCIÓN: Cambia "/dashboard" por la ruta real de tu próximo archivo (Ej: "/inicio" o "/panel")
    window.location.href = "/dashboard"; 
  };

  // Validaciones finales antes de guardar en base de datos
  const validarFormulario = () => {
    if (perfilData.nombre.trim().length < 3 || perfilData.nombre.trim().length > 25) {
      return "El nombre debe tener entre 3 y 25 letras.";
    }
    if (perfilData.apellido.trim().length < 3 || perfilData.apellido.trim().length > 25) {
      return "El apellido debe tener entre 3 y 25 letras.";
    }
    if (perfilData.cedula.length < 7 || perfilData.cedula.length > 8) {
      return "La cédula debe tener 7 u 8 números.";
    }
    if (!perfilData.especialidad) {
      return "Debes seleccionar una especialidad médica.";
    }
    if (perfilData.telefono.length !== 10) {
      return "El teléfono debe tener exactamente 10 números.";
    }
    if (!perfilData.estado) {
      return "Debes seleccionar un estado.";
    }
    if (password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }
    if (password !== confirmPassword) {
      return "Las contraseñas no coinciden. Por favor verifica.";
    }
    
    return null; 
  };

  const handleFinalizarRegistro = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setMensaje({ tipo: 'error', texto: errorValidacion });
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: password
      });

      if (authError) throw authError;

      const telefonoCompleto = `+58${perfilData.telefono.trim()}`;

      const { error: dbError } = await supabase.from('doctores').insert([{
        id: user.id,
        nombre: perfilData.nombre.trim(),
        apellido: perfilData.apellido.trim(),
        cedula: perfilData.cedula.trim(),
        especialidad: perfilData.especialidad,
        telefono: telefonoCompleto,
        ciudad: perfilData.estado
      }]);

      if (dbError) throw dbError;
      
      // Cambio a la pantalla 2 (¡Listo!)
      setPaso(2);
      
      // Activo un temporizador para que lo envíe automático al dashboard a los 3 segundos
      setTimeout(() => {
        irAlSiguienteArchivo();
      }, 3000);

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
            {mensaje.tipo === 'error' ? (
              <svg className="w-6 h-6 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg className="w-6 h-6 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
            <p className="text-sm font-medium">{mensaje.texto}</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-[360px] z-10 flex flex-col pt-2 pb-6 h-full overflow-y-auto overflow-x-hidden scrollbar-hide">
        {paso === 1 ? (
          <div className="animate-fade-in flex flex-col">
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-wide mb-1 uppercase">
                Kardex
              </h2>
              <h1 className="text-white text-xl font-bold">Completar Perfil</h1>
              
              <div className="mt-3 inline-flex items-center gap-2 bg-[#141824] border border-blue-500/30 px-3 py-1.5 rounded-full shadow-inner">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-slate-300 text-xs font-medium truncate max-w-[200px]">
                  {user?.email}
                </span>
              </div>
            </div>

            <form onSubmit={handleFinalizarRegistro} className="flex flex-col gap-4">
              
              <div className="grid grid-cols-2 gap-4">
                <input type="text" name="nombre" value={perfilData.nombre} onChange={handleLetrasChange} maxLength="25" className="w-full px-5 py-3.5 bg-[#141824] border border-white/10 rounded-2xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500/70 transition-all shadow-inner" placeholder="Nombres" />
                <input type="text" name="apellido" value={perfilData.apellido} onChange={handleLetrasChange} maxLength="25" className="w-full px-5 py-3.5 bg-[#141824] border border-white/10 rounded-2xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500/70 transition-all shadow-inner" placeholder="Apellidos" />
              </div>
              
              <input type="text" name="cedula" value={perfilData.cedula} onChange={handleNumerosChange} maxLength="8" className="w-full px-5 py-3.5 bg-[#141824] border border-white/10 rounded-2xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500/70 transition-all shadow-inner" placeholder="Cédula (Ej. 29123456)" />
              
              <div className="relative">
                <select name="especialidad" value={perfilData.especialidad} onChange={handlePerfilChange} className="w-full px-5 py-3.5 bg-[#141824] border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:border-blue-500/70 transition-all shadow-inner appearance-none cursor-pointer">
                  <option value="" disabled>Selecciona una especialidad</option>
                  <option value="Alergología">Alergología</option>
                  <option value="Anestesiología">Anestesiología</option>
                  <option value="Cardiología">Cardiología</option>
                  <option value="Cirugía General">Cirugía General</option>
                  <option value="Cirugía Plástica">Cirugía Plástica</option>
                  <option value="Dermatología">Dermatología</option>
                  <option value="Endocrinología">Endocrinología</option>
                  <option value="Gastroenterología">Gastroenterología</option>
                  <option value="Geriatría">Geriatría</option>
                  <option value="Ginecología y Obstetricia">Ginecología y Obstetricia</option>
                  <option value="Hematología">Hematología</option>
                  <option value="Infectología">Infectología</option>
                  <option value="Medicina General">Medicina General</option>
                  <option value="Medicina Interna">Medicina Interna</option>
                  <option value="Neumología">Neumología</option>
                  <option value="Neurología">Neurología</option>
                  <option value="Odontología">Odontología</option>
                  <option value="Oftalmología">Oftalmología</option>
                  <option value="Oncología">Oncología</option>
                  <option value="Otorrinolaringología">Otorrinolaringología</option>
                  <option value="Pediatría">Pediatría</option>
                  <option value="Psiquiatría">Psiquiatría</option>
                  <option value="Radiología">Radiología</option>
                  <option value="Reumatología">Reumatología</option>
                  <option value="Traumatología y Ortopedia">Traumatología y Ortopedia</option>
                  <option value="Urología">Urología</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_1fr] gap-4">
                <div className="flex shadow-inner rounded-2xl border border-white/10 bg-[#141824] focus-within:border-blue-500/70 transition-all overflow-hidden">
                  <span className="flex items-center justify-center pl-4 pr-2 bg-[#141824] text-slate-400 text-sm font-medium border-r border-white/5">
                    +58
                  </span>
                  <input type="text" name="telefono" value={perfilData.telefono} onChange={handleNumerosChange} maxLength="10" className="w-full px-2 py-3.5 bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none" placeholder="4121234567" />
                </div>
                
                <div className="relative">
                  <select name="estado" value={perfilData.estado} onChange={handlePerfilChange} className="w-full px-5 py-3.5 bg-[#141824] border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:border-blue-500/70 transition-all shadow-inner appearance-none cursor-pointer">
                    <option value="" disabled>Estado...</option>
                    <option value="Amazonas">Amazonas</option>
                    <option value="Anzoátegui">Anzoátegui</option>
                    <option value="Apure">Apure</option>
                    <option value="Aragua">Aragua</option>
                    <option value="Barinas">Barinas</option>
                    <option value="Bolívar">Bolívar</option>
                    <option value="Carabobo">Carabobo</option>
                    <option value="Cojedes">Cojedes</option>
                    <option value="Delta Amacuro">Delta Amacuro</option>
                    <option value="Distrito Capital">Distrito Capital</option>
                    <option value="Falcón">Falcón</option>
                    <option value="Guárico">Guárico</option>
                    <option value="La Guaira">La Guaira</option>
                    <option value="Lara">Lara</option>
                    <option value="Mérida">Mérida</option>
                    <option value="Miranda">Miranda</option>
                    <option value="Monagas">Monagas</option>
                    <option value="Nueva Esparta">Nueva Esparta</option>
                    <option value="Portuguesa">Portuguesa</option>
                    <option value="Sucre">Sucre</option>
                    <option value="Táchira">Táchira</option>
                    <option value="Trujillo">Trujillo</option>
                    <option value="Yaracuy">Yaracuy</option>
                    <option value="Zulia">Zulia</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Seguridad</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              <div className="relative">
                <input 
                  type={mostrarPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full px-5 py-3.5 bg-[#141824] border border-blue-500/40 rounded-2xl text-white placeholder-blue-300/60 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner" 
                  placeholder="Crea una contraseña (Mín. 6)" 
                />
                <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {mostrarPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 015.002-5.414m2.59-1.02A10.01 10.01 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-2.458 3.864m-4.242-4.242a3 3 0 014.242 4.242M3 3l18 18" /></svg>
                  )}
                </button>
              </div>

              <div className="relative">
                <input 
                  type={mostrarConfirm ? "text" : "password"} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="w-full px-5 py-3.5 bg-[#141824] border border-blue-500/40 rounded-2xl text-white placeholder-blue-300/60 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner" 
                  placeholder="Confirma tu contraseña" 
                />
                <button type="button" onClick={() => setMostrarConfirm(!mostrarConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {mostrarConfirm ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 015.002-5.414m2.59-1.02A10.01 10.01 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-2.458 3.864m-4.242-4.242a3 3 0 014.242 4.242M3 3l18 18" /></svg>
                  )}
                </button>
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl text-slate-900 font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-blue-500/20">
                {loading ? 'Guardando...' : 'Finalizar Registro'}
              </button>
            </form>

            <button 
              onClick={handleVolver} 
              type="button"
              className="text-slate-400 text-sm text-center mt-6 mb-4 hover:text-white transition cursor-pointer"
            >
              ← Cancelar y volver atrás
            </button>
          </div>
        ) : (
          <div className="animate-fade-in flex flex-col items-center justify-center py-10 w-full">
            <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
              <svg className="w-10 h-10 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h1 className="text-white text-3xl font-bold text-center mb-4">¡Listo!</h1>
            <p className="text-slate-300 text-sm text-center mb-8 px-2">
              Tu cuenta médica ha sido creada y configurada con éxito.
            </p>
            
            {/* Nuevo botón para redireccionar manualmente */}
            <button 
              onClick={irAlSiguienteArchivo} 
              className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white font-bold text-sm transition-all shadow-inner"
            >
              Continuar al sistema
            </button>
          </div>
        )}
      </div>
    </>
  );
}