type Status = 'new' | 'processing' | 'completed' | 'converted';

const config: Record<Status, { label: string; color: string; dot: string }> = {
  new: { label: 'Novo', color: 'bg-zinc-100 text-zinc-900 border-zinc-300', dot: 'bg-zinc-600' },
  processing: { label: 'Processando', color: 'bg-blue-100 text-blue-950 border-blue-300', dot: 'bg-blue-600 animate-pulse' },
  completed: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-950 border-emerald-300', dot: 'bg-emerald-600' },
  converted: { label: 'Cliente', color: 'bg-violet-100 text-violet-950 border-violet-300', dot: 'bg-violet-600' },
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
