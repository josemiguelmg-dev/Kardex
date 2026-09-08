export default function Inicio({ doctor }) {
  return (
    <div className="animate-fade-in max-w-5xl mx-auto mt-4 sm:mt-10">
      <div className="bg-gradient-to-br from-[#141824] to-[#0a0d16] p-8 sm:p-12 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[250px] sm:min-h-[300px]">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="z-10 flex flex-col gap-2 w-full md:w-3/5 text-center md:text-left">
          <span className="text-cyan-400 font-bold tracking-widest uppercase text-[10px] sm:text-xs bg-cyan-500/10 w-fit px-3 py-1 rounded-md mx-auto md:mx-0">
            Panel Principal
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 leading-tight mt-2">
            ¡Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{doctor.nombre} {doctor.apellido}</span>!
          </h1>
          <p className="text-slate-400 font-medium text-sm sm:text-base">
            Especialidad: {doctor.especialidad}
          </p>
        </div>

        {/* IMAGEN DE BIENVENIDA AJUSTADA PARA MÓVIL */}
        <div className="absolute -bottom-4 -right-4 opacity-30 md:relative md:bottom-0 md:right-0 md:opacity-100 w-32 sm:w-48 md:w-64 pointer-events-none z-0 transition-all duration-300">
          <img 
            src="/calen.svg" 
            alt="Ilustración Bienvenida" 
            className="w-full h-auto drop-shadow-2xl object-contain" 
          />
        </div>
      </div>
    </div>
  );
}