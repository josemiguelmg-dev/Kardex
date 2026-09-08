export default function Inicio({ doctor }) {
  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-[#141824] to-[#0a0d16] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none"></div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
          ¡Bienvenido de vuelta, {doctor.nombre} {doctor.apellido}!
        </h1>
        <p className="text-cyan-400 font-medium text-sm">{doctor.especialidad}</p>
      </div>
    </div>
  );
}