interface Controller {
  id: string;
  label: string;
  isActive: boolean;
}

interface ControllersPanelProps {
  controllers: Controller[];
  onToggle: (id: string) => void;
}

export function ControllersPanel({ controllers, onToggle }: ControllersPanelProps) {
  return (
    <div className="controllers-panel">
      <div className="mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Controllers
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {controllers.map(c => (
          <button
            key={c.id}
            onClick={() => onToggle(c.id)}
            className={`px-3 py-1.5 text-[9px] uppercase tracking-wider rounded-md border transition-all ${
              c.isActive 
                ? 'bg-[#2a2a2a] border-[#4a4a4a] text-[#e0e0e0] shadow-[0_0_8px_rgba(74,222,128,0.2)]' 
                : 'bg-[#1a1a1a] border-[#3a3a3a] text-[#888888] hover:bg-[#222222] hover:border-[#4a4a4a] hover:text-[#aaaaaa]'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
