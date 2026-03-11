import { cn } from "@/lib/utils";

interface BeforeAfterRow {
  label: string;
  before: string;
  after: string;
}

interface BeforeAfterTableProps {
  rows: BeforeAfterRow[];
  className?: string;
}

const BeforeAfterTable = ({ rows, className }: BeforeAfterTableProps) => {
  return (
    <div className={cn("rounded-2xl border border-border overflow-hidden", className)}>
      {/* Header */}
      <div className="grid grid-cols-3">
        <div className="bg-muted/50 p-4 font-semibold text-foreground border-b border-border">
          Problem
        </div>
        <div className="bg-red-500/10 p-4 font-semibold text-red-600 text-center border-b border-border">
          Przed
        </div>
        <div className="bg-green-500/10 p-4 font-semibold text-green-600 text-center border-b border-border">
          Po
        </div>
      </div>
      
      {/* Rows */}
      {rows.map((row, index) => (
        <div 
          key={index} 
          className={cn(
            "grid grid-cols-3",
            index < rows.length - 1 && "border-b border-border"
          )}
        >
          <div className="p-4 text-muted-foreground bg-card">
            {row.label}
          </div>
          <div className="p-4 text-center font-medium text-red-600 bg-red-500/5">
            {row.before}
          </div>
          <div className="p-4 text-center font-bold text-green-600 bg-green-500/5">
            {row.after}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BeforeAfterTable;
