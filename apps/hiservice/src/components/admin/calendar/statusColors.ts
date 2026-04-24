export const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-200 border-emerald-400 text-emerald-900';
    case 'in_progress':
      return 'bg-orange-200 border-orange-400 text-orange-900';
    case 'completed':
      return 'bg-slate-200 border-slate-400 text-slate-700';
    case 'cancelled':
      return 'bg-red-100/60 border-red-300 text-red-700 line-through opacity-60';
    case 'change_requested':
      return 'bg-red-200 border-red-400 text-red-900';
    case 'unfinished':
      return 'bg-purple-200 border-purple-500 text-purple-900';
    case 'follow_up':
      return 'bg-purple-100 border-purple-300 text-purple-800';
    default:
      return 'bg-amber-100 border-amber-300 text-amber-900';
  }
};
