import { Input } from '@shared/ui';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EditingPrice {
  scopeId: string;
  productId: string;
  value: string;
  isSuggested?: boolean;
}

interface ProductItemRowProps {
  scopeId: string;
  product: {
    id: string;
    productId: string;
    variantName: string | null;
    productName: string;
    productShortName: string | null;
    price: number;
  };
  isSuggested?: boolean;
  editingPrice: EditingPrice | null;
  formatPrice: (value: number) => string;
  onEditPrice: (scopeId: string, productId: string, value: string, isSuggested: boolean) => void;
  onCommitPrice: (scopeId: string, productId: string, value: string, isSuggested: boolean) => void;
  onCancelEditPrice: () => void;
  onRemove: (scopeId: string, productId: string) => void;
  onEditProduct: (productId: string) => void;
}

export function ProductItemRow({
  scopeId,
  product,
  isSuggested = false,
  editingPrice,
  formatPrice,
  onEditPrice,
  onCommitPrice,
  onCancelEditPrice,
  onRemove,
  onEditProduct,
}: ProductItemRowProps) {
  const { t } = useTranslation();

  const isEditing =
    editingPrice?.scopeId === scopeId &&
    editingPrice?.productId === product.id &&
    (isSuggested ? editingPrice?.isSuggested : !editingPrice?.isSuggested);

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-muted/15 rounded-lg">
      <div className="flex-1">
        {product.variantName && (
          <p className="text-xs text-muted-foreground font-medium uppercase">
            {product.variantName}
          </p>
        )}
        <button
          type="button"
          onClick={() => onEditProduct(product.productId)}
          className="font-medium text-sm text-left hover:text-primary hover:underline transition-colors"
        >
          {product.productShortName || product.productName}
        </button>
      </div>
      <div className="flex items-center gap-2">
        {isEditing && editingPrice ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={editingPrice.value}
              onChange={(e) => onEditPrice(scopeId, product.id, e.target.value, isSuggested)}
              className="w-24 h-8 text-right"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onCommitPrice(scopeId, product.id, editingPrice.value, isSuggested);
                }
                if (e.key === 'Escape') onCancelEditPrice();
              }}
              onBlur={() => {
                onCommitPrice(scopeId, product.id, editingPrice.value, isSuggested);
              }}
            />
            <span className="text-xs text-muted-foreground">zł</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onEditPrice(scopeId, product.id, String(product.price), isSuggested)}
            className="font-semibold hover:bg-hover rounded px-2 py-1 transition-colors"
            title={t('summary.clickToEdit')}
          >
            {formatPrice(product.price)}
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemove(scopeId, product.id)}
          className="p-1 text-destructive hover:text-destructive/80 transition-colors"
          title={t('summary.removeService')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
