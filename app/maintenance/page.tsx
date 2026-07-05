export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#0D0B14] flex flex-col items-center justify-center p-4">
      <div className="w-24 h-24 bg-teal-500/20 rounded-3xl flex items-center justify-center mb-8 animate-pulse">
        <span className="text-5xl">🐍</span>
      </div>
      <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-widest text-center mb-4">
        We're upgrading SnakeBet
      </h1>
      <p className="text-gray-400 font-mono text-center max-w-md">
        The platform is currently undergoing scheduled maintenance. We will be back online shortly with new features and improvements.
      </p>
      <div className="mt-12 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"></div>
        <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
}
