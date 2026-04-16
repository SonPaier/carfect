import { Checkbox } from '@shared/ui';
import { Button } from '@shared/ui';
import type { ConsentClauseDef } from '../types';
import type { CustomFieldValues } from '@shared/custom-fields';

interface ConsentClauseRendererProps {
  clauses: ConsentClauseDef[];
  values: CustomFieldValues;
  onChange: (values: CustomFieldValues) => void;
  onRequestSignature: (clauseId: string, onSigned: (dataUrl: string) => void) => void;
  disabled?: boolean;
}

export function ConsentClauseRenderer({
  clauses,
  values,
  onChange,
  onRequestSignature,
  disabled,
}: ConsentClauseRendererProps) {
  const sorted = [...clauses].sort((a, b) => a.order - b.order);

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-3">
      {sorted.map((clause) => {
        const isChecked = !!values[clause.id];
        const signatureUrl = values[`${clause.id}_sig`] as string | undefined;

        return (
          <div key={clause.id} className="flex items-start gap-3 p-3 border rounded-lg">
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) => {
                const next = { ...values, [clause.id]: !!checked };
                if (!checked) {
                  delete next[`${clause.id}_sig`];
                }
                onChange(next);
              }}
              disabled={disabled}
            />
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">{clause.text}</p>
              {clause.requiresSignature && isChecked && (
                <div>
                  {signatureUrl ? (
                    <img
                      src={signatureUrl}
                      alt="Podpis"
                      className="h-12 border rounded"
                    />
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={disabled}
                      onClick={() =>
                        onRequestSignature(clause.id, (dataUrl) =>
                          onChange({ ...values, [`${clause.id}_sig`]: dataUrl })
                        )
                      }
                    >
                      Podpisz
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
