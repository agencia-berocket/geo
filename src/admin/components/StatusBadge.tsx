type Status = 'new' | 'processing' | 'completed' | 'converted';

const config: Record<Status, { label: string; color: string; dot: string }> = {
  new: { label: 'Novo', color: 'bg-zinc-700/50 text-zinc-300 border-zinc-600', dot: 'bg-zinc-400' },
  processing: { label: 'Processando', color: 'bg-blue-900/40 text-blue-300 border-blue-700', dot: 'bg-blue-400 animate-pulse' },
  completed: { label: 'Concluído', color: 'bg-emerald-900/40 text-emerald-300 border-emerald-700', dot: 'bg-emerald-400' },
  converted: { label: 'Cliente', color: 'bg-violet-900/40 text-violet-300 border-violet-700', dot: 'bg-violet-400' },
};

export default function StatusBadge({ status }: { status: Status }) {
  const { label, color, dot } = config[status] ?? config.new;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
