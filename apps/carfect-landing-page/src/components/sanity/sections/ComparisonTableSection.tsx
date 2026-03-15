import { Check, X } from 'lucide-react';
import type { ComparisonTableSection as ComparisonTableSectionType } from '@/types/sanity';

interface ComparisonTableSectionProps {
  data: ComparisonTableSectionType;
}

function renderValue(value: string) {
  if (value === '✓' || value.toLowerCase() === 'tak') {
    return <Check className="w-5 h-5 text-green-600 mx-auto" />;
  }
  if (value === '✗' || value === '—' || value.toLowerCase() === 'nie') {
    return <X className="w-5 h-5 text-red-400 mx-auto" />;
  }
  return <span>{value}</span>;
}

export default function ComparisonTableSection({ data }: ComparisonTableSectionProps) {
  const columnLabels = data.columnLabels || [];
  const rows = data.rows || [];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container px-4">
        {(data.heading || data.subheading) && (
          <header className="text-center mb-12 md:mb-16">
            {data.heading && <h2 className="text-3xl md:text-4xl font-bold text-foreground">{data.heading}</h2>}
            {data.subheading && <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{data.subheading}</p>}
          </header>
        )}

        <div className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 border-b-2 border-border font-semibold text-foreground">Funkcja</th>
                {columnLabels.map((label, i) => (
                  <th key={i} className="text-center p-4 border-b-2 border-border font-semibold text-foreground">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="p-4 text-foreground font-medium">{row.feature}</td>
                  {(row.values || []).map((value, j) => (
                    <td key={j} className="p-4 text-center text-muted-foreground">{renderValue(value)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
