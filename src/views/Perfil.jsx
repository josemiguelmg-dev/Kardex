import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient.js';

export default function Perfil({ user, onActualizar }) {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cedula, setCedula] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const cargarPerfil = async () => {
      const { data } = await supabase.from('doctores').select('*').eq('id', user.id).single();
      if (data) {
        setNombre(data.nombre || ''); setApellido(data.apellido || ''); setCedula(data.cedula || '');
        setEspecialidad(data.especialidad || ''); setTelefono(data.telefono || ''); setCiudad(data.ciudad || ''); 
      }
    };
    cargarPerfil();
  }, [user]);

  const handleActualizar = async (e) => {
    e.preventDefault();
    setLoading(true); setMensaje({ tipo: '', texto: '' });
    
    try {
      const { data, error: errorDB } = await supabase.from('doctores').update({ nombre, apellido, cedula, especialidad, telefono, ciudad }).eq('id', user.id).select();
      if (errorDB) throw errorDB;
      if (!data || data.length === 0) throw new Error("Sin permisos para actualizar.");
      
      if (password) await supabase.auth.updateUser({ password });
      if (email !== user.email) await supabase.auth.updateUser({ email });
      
      setMensaje({ tipo: 'exito', texto: '¡Tus datos han sido actualizados exitosamente!' });
      onActualizar({ nombre: nombre.split(' ')[0], apellido: apellido.split(' ')[0], especialidad });
      
      if (localStorage.getItem('huellaActivada') === 'true') {
         localStorage.setItem('kardex_cred_name', `${nombre.split(' ')[0]} ${apellido.split(' ')[0]}`);
         localStorage.setItem('kardex_cred_especialidad', especialidad);
      }
      setPassword('');
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'Hubo un error al guardar.' });
    } finally {
      setLoading(false);
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in w-full pb-10">
      
      {/* Banner Superior con Imagen Ajustada */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#141824] to-[#0a0d16] p-6 sm:p-8 rounded-[2rem] border border-white/5 shadow-xl mb-6 sm:mb-8 relative overflow-hidden h-32 sm:h-44">
        <div className="absolute bottom-[-50%] left-[-10%] w-48 h-48 bg-cyan-500/10 blur-[50px] rounded-full"></div>
        <div className="z-10 max-w-[60%] sm:max-w-full">
          <h2 className="text-xl sm:text-3xl font-bold text-white mb-1">Tu Perfil</h2>
          <p className="text-slate-400 text-[10px] sm:text-sm">Gestiona tu información profesional y credenciales.</p>
        </div>
        
        {/* IMAGEN MÁS PEQUEÑA EN MÓVIL */}
        <img 
          src="/medicine.svg" 
          alt="Ilustración Perfil" 
          className="absolute right-2 bottom-0 w-24 sm:w-36 lg:w-48 h-auto drop-shadow-2xl z-10 opacity-80 sm:opacity-100 object-contain" 
        />
      </div>
      
      {mensaje.texto && (
        <div className={`mb-6 px-5 py-4 rounded-2xl border transition-all ${mensaje.tipo === 'error' ? 'bg-red-900/40 border-red-500/50 text-red-200' : 'bg-cyan-900/40 border-cyan-500/50 text-cyan-200'}`}>
          <p className="text-sm font-medium">{mensaje.texto}</p>
        </div>
      )}

      <form onSubmit={handleActualizar} className="bg-[#141824] p-5 sm:p-8 rounded-[2rem] border border-white/10 shadow-xl flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Nombres</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Apellidos</label>
            <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} required className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Cédula</label>
            <input type="text" value={cedula} onChange={(e) => setCedula(e.target.value)} required className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Teléfono (+58)</label>
            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej. 04241234567" className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Ciudad</label>
            <input type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Ej. Punto Fijo" className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Especialidad Médica</label>
          <select value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} required className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none text-sm">
            <option value="" disabled>Selecciona una especialidad...</option>
            <option value="Cardiología">Cardiología</option>
            <option value="Pediatría">Pediatría</option>
            <option value="Medicina General">Medicina General</option>
            <option value="Cirugía">Cirugía</option>
            <option value="Traumatología">Traumatología</option>
          </select>
        </div>

        <div className="border-t border-white/5 my-1"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Correo Electrónico (Login)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Nueva Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Dejar en blanco para no cambiar" className="w-full px-4 py-3 bg-[#0a0d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-600 text-sm" />
          </div>
        </div>

        <div className="border-t border-white/5 mt-2 pt-5 flex justify-end">
          <button type="submit" disabled={loading} className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl text-slate-900 font-bold hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">
            {loading ? 'Guardando...' : 'Guardar Perfil'}
          </button>
        </div>
      </form>
    </div>
  );
}