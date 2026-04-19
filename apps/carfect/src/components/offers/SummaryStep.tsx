import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { Textarea } from '@shared/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui';
import { Separator } from '@shared/ui';
import { RadioGroup, RadioGroupItem } from '@shared/ui';
import { Checkbox } from '@shared/ui';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@shared/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui';
import { 
  User, 
  Building2, 
  Car, 
  FileText, 
  Calculator,
  Tag,
  X,
  ChevronDown,
  Star,
} from 'lucide-react';
import { CustomerData, VehicleData, OfferOption, OfferState, OfferItem, DefaultSelectedState } from '@/hooks/useOffer';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface SummaryStepProps {
  instanceId: string;
  offer: OfferState;
  showUnitPrices: boolean;
  onUpdateOffer: (data: Partial<OfferState>) => void;
  onUpdateOption: (optionId: string, data: Partial<OfferOption>) => void;
  onRemoveItem?: (optionId: string, itemId: string) => void;
  onUpdateDefaultSelection?: (state: DefaultSelectedState) => void;
  calculateOptionTotal: (option: OfferOption) => number;
  calculateTotalNet: () => number;
  calculateTotalGross: () => number;
  onShowPreview?: () => void;
}

interface OfferTemplate {
  id: string;
  name: string;
  payment_terms: string | null;
  notes: string | null;
}

interface DiscountState {
  optionId: string;
  type: 'percent' | 'amount';
  value: string;
}

interface EditingPriceState {
  optionId: string;
  value: string;
}

interface EditingItemPriceState {
  optionId: string;
  itemId: string;
  value: string;
}

const getPaintTypeLabel = (type: string, t: (key: string) => string): string => {
  const labels: Record<string, string> = {
    matte: t('summary.paintTypeMat'),
    dark: t('summary.paintTypeDark'),
    other: t('summary.paintTypeOther'),
  };
  return labels[type] || type;
};

export const SummaryStep = ({
  instanceId,
  offer,
  showUnitPrices,
  onUpdateOffer,
  onUpdateOption,
  onRemoveItem,
  onUpdateDefaultSelection,
  calculateOptionTotal,
  calculateTotalNet,
  calculateTotalGross,
  onShowPreview,
}: SummaryStepProps) => {
  const { t } = useTranslation();
  const [discountEditing, setDiscountEditing] = useState<DiscountState | null>(null);
  const [editingPrice, setEditingPrice] = useState<EditingPriceState | null>(null);
  const [editingItemPrice, setEditingItemPrice] = useState<EditingItemPriceState | null>(null);
  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [scopes, setScopes] = useState<{ id: string; name: string }[]>([]);
  const [conditionsOpen, setConditionsOpen] = useState(true);

  // Local state for default selections (synced from offer.defaultSelectedState)
  const [defaultScopeId, setDefaultScopeId] = useState<string | null>(null);
  const [defaultVariants, setDefaultVariants] = useState<Record<string, string>>({});
  const [defaultOptionalItems, setDefaultOptionalItems] = useState<Record<string, boolean>>({});
  const [defaultItemInOption, setDefaultItemInOption] = useState<Record<string, string>>({});

  // Initialize from offer.defaultSelectedState
  useEffect(() => {
    if (offer.defaultSelectedState) {
      setDefaultScopeId(offer.defaultSelectedState.selectedScopeId ?? null);
      setDefaultVariants(offer.defaultSelectedState.selectedVariants || {});
      setDefaultOptionalItems(offer.defaultSelectedState.selectedOptionalItems || {});
      setDefaultItemInOption(offer.defaultSelectedState.selectedItemInOption || {});
    }
  }, [offer.id, offer.defaultSelectedState]); // Re-run when offer or its defaultSelectedState changes

  // Sync local changes back to parent
  const updateDefaultState = (updates: Partial<DefaultSelectedState>) => {
    const newState: DefaultSelectedState = {
      selectedScopeId: updates.selectedScopeId !== undefined ? updates.selectedScopeId : defaultScopeId,
      selectedVariants: updates.selectedVariants || defaultVariants,
      selectedOptionalItems: updates.selectedOptionalItems || defaultOptionalItems,
      selectedItemInOption: updates.selectedItemInOption || defaultItemInOption,
    };
    
    // Update local state
    if (updates.selectedScopeId !== undefined) setDefaultScopeId(updates.selectedScopeId);
    if (updates.selectedVariants) setDefaultVariants(updates.selectedVariants);
    if (updates.selectedOptionalItems) setDefaultOptionalItems(updates.selectedOptionalItems);
    if (updates.selectedItemInOption) setDefaultItemInOption(updates.selectedItemInOption);
    
    // Notify parent
    onUpdateDefaultSelection?.(newState);
  };

  const handleSetDefaultVariant = (scopeId: string, optionId: string) => {
    const newVariants = { ...defaultVariants, [scopeId]: optionId };
    updateDefaultState({
      selectedScopeId: scopeId,
      selectedVariants: newVariants,
    });
  };

  const handleToggleDefaultOptionalItem = (itemId: string, option?: OfferOption) => {
    const newOptionalItems = { ...defaultOptionalItems, [itemId]: !defaultOptionalItems[itemId] };
    
    // If selecting an item from a non-extras scope, ensure scope is selected
    if (option?.scopeId && !option.isUpsell) {
      const newVariants = { ...defaultVariants, [option.scopeId]: option.id };
      updateDefaultState({
        selectedScopeId: defaultScopeId || option.scopeId,
        selectedVariants: newVariants,
        selectedOptionalItems: newOptionalItems,
      });
    } else {
      updateDefaultState({ selectedOptionalItems: newOptionalItems });
    }
  };

  const handleSetDefaultItemInOption = (optionId: string, itemId: string) => {
    const newItemInOption = { ...defaultItemInOption, [optionId]: itemId };
    
    // Find the option to get its scopeId and auto-set scope/variant
    const option = offer.options.find(o => o.id === optionId);
    if (option?.scopeId) {
      const newVariants = { ...defaultVariants, [option.scopeId]: optionId };
      updateDefaultState({ 
        selectedScopeId: option.scopeId,
        selectedVariants: newVariants,
        selectedItemInOption: newItemInOption,
      });
    } else {
      updateDefaultState({ selectedItemInOption: newItemInOption });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch templates
      const { data: templatesData } = await supabase
        .from('text_blocks_library')
        .select('*')
        .eq('active', true)
        .eq('block_type', 'offer_template')
        .or(`instance_id.eq.${instanceId},source.eq.global`)
        .order('sort_order');
      
      if (templatesData) {
        setTemplates(templatesData.map(t => ({
          id: t.id,
          name: t.name,
          payment_terms: t.content.split('|||')[0] || null,
          notes: t.content.split('|||')[1] || null,
        })));
      }

      // Fetch scopes for grouping
      if (offer.selectedScopeIds.length > 0) {
        const { data: scopesData } = await supabase
          .from('offer_scopes')
          .select('id, name, sort_order')
          .in('id', offer.selectedScopeIds)
          .order('sort_order');
        
        if (scopesData) {
          setScopes(scopesData);
        }
      }
    };
    fetchData();
  }, [instanceId, offer.selectedScopeIds]);

  // Group options by scope
  const groupedOptions = useMemo(() => {
    const groups: { scopeId: string | null; scopeName: string; options: OfferOption[] }[] = [];
    
    // Group by scope
    for (const scope of scopes) {
      const scopeOptions = offer.options
        .filter(o => o.scopeId === scope.id && o.isSelected)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      if (scopeOptions.length > 0) {
        groups.push({ scopeId: scope.id, scopeName: scope.name, options: scopeOptions });
      }
    }
    
    // Options without scope
    const noScopeOptions = offer.options.filter(o => !o.scopeId && o.isSelected);
    if (noScopeOptions.length > 0) {
      groups.push({ scopeId: null, scopeName: t('summary.other'), options: noScopeOptions });
    }
    
    return groups;
  }, [offer.options, scopes]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  };

  // Calculate original total before any discounts
  const calculateOriginalTotal = (option: OfferOption) => {
    return option.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  // Check if option has any discount
  const hasDiscount = (option: OfferOption) => {
    return option.items.some(item => item.discountPercent > 0);
  };

  const handleOpenDiscount = (optionId: string) => {
    setDiscountEditing({
      optionId,
      type: 'percent',
      value: '0',
    });
  };

  const handleApplyDiscount = (option: OfferOption) => {
    if (!discountEditing) return;
    
    const value = parseFloat(discountEditing.value) || 0;
    
    if (discountEditing.type === 'percent') {
      // Apply percentage discount to all items
      const updatedItems = option.items.map(item => ({
        ...item,
        discountPercent: value,
      }));
      onUpdateOption(discountEditing.optionId, { items: updatedItems });
    } else {
      // Calculate percentage from fixed amount
      const originalTotal = calculateOriginalTotal(option);
      if (originalTotal > 0) {
        const percentDiscount = (value / originalTotal) * 100;
        const updatedItems = option.items.map(item => ({
          ...item,
          discountPercent: Math.min(percentDiscount, 100),
        }));
        onUpdateOption(discountEditing.optionId, { items: updatedItems });
      }
    }
    setDiscountEditing(null);
  };

  const handleRemoveDiscount = (optionId: string, option: OfferOption) => {
    const updatedItems = option.items.map(item => ({
      ...item,
      discountPercent: 0,
    }));
    onUpdateOption(optionId, { items: updatedItems });
  };

  // Handle editing price for multi-variant options
  const handleStartEditPrice = (optionId: string, currentTotal: number) => {
    setEditingPrice({
      optionId,
      value: String(Math.round(currentTotal)),
    });
  };

  const handleApplyEditedPrice = (option: OfferOption) => {
    if (!editingPrice) return;
    
    const newTotal = parseFloat(editingPrice.value) || 0;
    const currentTotal = calculateOptionTotal(option);
    
    if (newTotal > 0 && currentTotal > 0 && option.items.length > 0) {
      // Distribute the new total proportionally across items
      const ratio = newTotal / currentTotal;
      const updatedItems = option.items.map(item => ({
        ...item,
        unitPrice: Math.round(item.unitPrice * ratio),
      }));
      onUpdateOption(editingPrice.optionId, { items: updatedItems });
    }
    setEditingPrice(null);
  };

  // Handle editing individual item price
  const handleStartEditItemPrice = (optionId: string, itemId: string, currentPrice: number) => {
    setEditingItemPrice({
      optionId,
      itemId,
      value: String(Math.round(currentPrice)),
    });
  };

  const handleApplyEditedItemPrice = (option: OfferOption) => {
    if (!editingItemPrice) return;
    
    const newPrice = parseFloat(editingItemPrice.value) || 0;
    if (newPrice >= 0) {
      const updatedItems = option.items.map(item => 
        item.id === editingItemPrice.itemId 
          ? { ...item, unitPrice: newPrice }
          : item
      );
      onUpdateOption(editingItemPrice.optionId, { items: updatedItems });
    }
    setEditingItemPrice(null);
  };

  const handleApplyTemplate = (template: OfferTemplate) => {
    onUpdateOffer({
      paymentTerms: template.payment_terms || offer.paymentTerms,
      notes: template.notes || offer.notes,
    });
  };

  const totalNet = calculateTotalNet();
  const totalGross = calculateTotalGross();
  const vatAmount = totalGross - totalNet;

  return (
    <div className="space-y-6">
      {/* Customer & Vehicle Summary - single Card */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Customer Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <User className="w-4 h-4 text-primary" />
              {t('summary.customer')}
            </div>
            <div className="text-sm space-y-1 pl-6">
              <p className="font-medium">{offer.customerData.name || '—'}</p>
              <p className="text-muted-foreground">{offer.customerData.email || '—'}</p>
              {offer.customerData.phone && (
                <p className="text-muted-foreground">{offer.customerData.phone}</p>
              )}
            </div>
          </div>
          
          {/* Company Section */}
          {offer.customerData.company && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <Building2 className="w-4 h-4 text-primary" />
                {t('summary.company')}
              </div>
              <div className="text-sm space-y-1 pl-6">
                <p className="font-medium">{offer.customerData.company}</p>
                {offer.customerData.nip && (
                  <p className="text-muted-foreground">{t('summary.nip', { nip: offer.customerData.nip })}</p>
                )}
              </div>
            </div>
          )}

          {/* Vehicle Section */}
          {offer.vehicleData.brandModel && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <Car className="w-4 h-4 text-primary" />
                {t('summary.vehicle')}
              </div>
              <div className="text-sm space-y-1 pl-6">
                <p className="font-medium">{offer.vehicleData.brandModel}</p>
                {(offer.vehicleData.paintColor || offer.vehicleData.paintType) && (
                  <p className="text-muted-foreground">
                    {offer.vehicleData.paintColor}
                    {offer.vehicleData.paintColor && offer.vehicleData.paintType && ' • '}
                    {offer.vehicleData.paintType && getPaintTypeLabel(offer.vehicleData.paintType, t)}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Options - grouped by scope, all variants in one Card per scope */}
      {groupedOptions.map((group) => (
        <Card key={group.scopeId || 'other'} className="p-5">
          {/* Scope header */}
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">{group.scopeName}</h3>
          </div>
          
          <div className="space-y-6">
            {group.options.map((option) => {
              const originalTotal = calculateOriginalTotal(option);
              const currentTotal = calculateOptionTotal(option);
              const optionHasDiscount = hasDiscount(option);
              const isEditingThisOption = discountEditing?.optionId === option.id;
              const isUpsell = option.isUpsell;
              const scopeId = option.scopeId || group.scopeId || '';
              
              // Check if this option is the default variant for its scope
              const isDefaultVariant = !isUpsell && scopeId && defaultVariants[scopeId] === option.id;
              // For upsells, check if all items are marked as default
              const hasOptionalItems = option.items.some(i => i.isOptional || isUpsell);
              // Check for multi-item options (non-optional items > 1)
              const nonOptionalItems = option.items.filter(i => !i.isOptional);
              const hasMultipleNonOptional = nonOptionalItems.length > 1;
              
              return (
                <div key={option.id} className="space-y-3 border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Default variant selector (for non-upsell options) */}
                      {!isUpsell && scopeId && onUpdateDefaultSelection && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultVariant(scopeId, option.id)}
                          className={cn(
                            "p-1 rounded-full transition-colors",
                            isDefaultVariant 
                              ? "text-amber-500 bg-amber-50" 
                              : "text-muted-foreground/40 hover:text-amber-400 hover:bg-amber-50/50"
                          )}
                          title={isDefaultVariant ? t('summary.defaultVariant') : t('summary.setAsDefault')}
                        >
                          <Star className={cn("h-4 w-4", isDefaultVariant && "fill-current")} />
                        </button>
                      )}
                      <h4 className="font-semibold">{option.name}</h4>
                      {isDefaultVariant && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          {t('summary.defaultBadge')}
                        </span>
                      )}
                    </div>
                    {/* Hide total sum for multi-variant options (customer chooses one) */}
                    {!hasMultipleNonOptional && (
                      <div className="text-right">
                        {editingPrice?.optionId === option.id ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Input
                              type="number"
                              value={editingPrice.value}
                              onChange={(e) => setEditingPrice({ ...editingPrice, value: e.target.value })}
                              className="w-28 h-8 text-right"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleApplyEditedPrice(option);
                                if (e.key === 'Escape') setEditingPrice(null);
                              }}
                            />
                            <span className="text-xs text-muted-foreground">zł</span>
                            <Button size="sm" variant="ghost" onClick={() => handleApplyEditedPrice(option)}>
                              ✓
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEditPrice(option.id, currentTotal)}
                            className="text-right hover:bg-hover-strong rounded px-2 py-1 transition-colors cursor-pointer"
                            title={t('summary.clickToEditValue')}
                          >
                            {optionHasDiscount ? (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground line-through text-sm">
                                  {formatPrice(originalTotal)}
                                </span>
                                <span className="font-semibold text-primary">
                                  {formatPrice(currentTotal)}
                                </span>
                              </div>
                            ) : (
                              <p className="font-semibold">{formatPrice(currentTotal)}</p>
                            )}
                            <p className="text-xs text-muted-foreground">{t('summary.net')}</p>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Items - conditional based on showUnitPrices */}
                  {showUnitPrices ? (
                    <div className="text-sm">
                      <div className="grid grid-cols-12 gap-2 px-2 py-1 bg-muted/50 rounded text-xs font-medium text-muted-foreground">
                        <div className="col-span-5">{t('summary.colPosition')}</div>
                        <div className="col-span-2 text-right">{t('summary.colQuantity')}</div>
                        <div className="col-span-2 text-right">{t('summary.colPrice')}</div>
                        <div className="col-span-1 text-right">{t('summary.colDiscount')}</div>
                        <div className="col-span-2 text-right">{t('summary.colValue')}</div>
                      </div>
                      {option.items.map((item) => {
                        const itemValue = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
                        const isOptionalOrUpsell = item.isOptional || isUpsell;
                        const isDefaultItem = defaultOptionalItems[item.id];
                        const isSelectedInMultiOption = hasMultipleNonOptional && !item.isOptional && defaultItemInOption[option.id] === item.id;
                        
                        return (
                          <div
                            key={item.id}
                            className="grid grid-cols-12 gap-2 px-2 py-2 border-b last:border-0 group hover:bg-hover"
                          >
                            <div className="col-span-5 flex items-center gap-1">
                              {/* Default selection for optional items / upsells */}
                              {isOptionalOrUpsell && onUpdateDefaultSelection && (
                                <Checkbox
                                  checked={isDefaultItem}
                                  onCheckedChange={() => handleToggleDefaultOptionalItem(item.id, option)}
                                  className="h-4 w-4"
                                  title={t('summary.defaultCheckedExtra')}
                                />
                              )}
                              {/* Default selection for multi-item options (radio) */}
                              {hasMultipleNonOptional && !item.isOptional && onUpdateDefaultSelection && (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultItemInOption(option.id, item.id)}
                                  className={cn(
                                    "h-5 w-5 min-w-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                                    isSelectedInMultiOption 
                                      ? "border-amber-500 bg-amber-500" 
                                      : "border-gray-400 hover:border-amber-400"
                                  )}
                                  title={isSelectedInMultiOption ? t('summary.defaultPosition') : t('summary.setAsDefaultPosition')}
                                >
                                  {isSelectedInMultiOption && (
                                    <div className="h-2 w-2 rounded-full bg-white" />
                                  )}
                                </button>
                              )}
                              {onRemoveItem && option.items.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-gray-400 hover:text-destructive flex-shrink-0"
                                  onClick={() => onRemoveItem(option.id, item.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                              <span>{item.customName}</span>
                              {isDefaultItem && isOptionalOrUpsell && (
                                <span className="text-xs text-amber-600">✓</span>
                              )}
                            </div>
                            <div className="col-span-2 text-right">
                              {item.quantity} {item.unit}
                            </div>
                            <div className="col-span-2 text-right">
                              {editingItemPrice?.optionId === option.id && editingItemPrice?.itemId === item.id ? (
                                <Input
                                  type="number"
                                  value={editingItemPrice.value}
                                  onChange={(e) => setEditingItemPrice({ ...editingItemPrice, value: e.target.value })}
                                  className="w-20 h-6 text-right text-xs"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleApplyEditedItemPrice(option);
                                    if (e.key === 'Escape') setEditingItemPrice(null);
                                  }}
                                  onBlur={() => handleApplyEditedItemPrice(option)}
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditItemPrice(option.id, item.id, item.unitPrice)}
                                  className="hover:bg-hover rounded px-1 transition-colors cursor-pointer"
                                  title={t('summaryStep.clickToEdit')}
                                >
                                  {formatPrice(item.unitPrice)}
                                </button>
                              )}
                            </div>
                            <div className="col-span-1 text-right">
                              {item.discountPercent > 0 && `-${item.discountPercent}%`}
                            </div>
                            <div className="col-span-2 text-right font-medium">
                              {formatPrice(itemValue)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm space-y-1">
                      {option.items.map((item) => {
                        const itemValue = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
                        const isOptionalOrUpsell = item.isOptional || isUpsell;
                        const isDefaultItem = defaultOptionalItems[item.id];
                        const isSelectedInMultiOption = hasMultipleNonOptional && !item.isOptional && defaultItemInOption[option.id] === item.id;
                        
                        return (
                          <div
                            key={item.id}
                            className="flex justify-between py-1 group hover:bg-hover px-1 rounded"
                          >
                            <div className="flex items-center gap-1">
                              {/* Default selection for optional items / upsells */}
                              {isOptionalOrUpsell && onUpdateDefaultSelection && (
                                <Checkbox
                                  checked={isDefaultItem}
                                  onCheckedChange={() => handleToggleDefaultOptionalItem(item.id, option)}
                                  className="h-4 w-4"
                                  title={t('summary.defaultCheckedExtra')}
                                />
                              )}
                              {/* Default selection for multi-item options (radio) */}
                              {hasMultipleNonOptional && !item.isOptional && onUpdateDefaultSelection && (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultItemInOption(option.id, item.id)}
                                  className={cn(
                                    "h-5 w-5 min-w-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                                    isSelectedInMultiOption 
                                      ? "border-amber-500 bg-amber-500" 
                                      : "border-gray-400 hover:border-amber-400"
                                  )}
                                  title={isSelectedInMultiOption ? t('summary.defaultPosition') : t('summary.setAsDefaultPosition')}
                                >
                                  {isSelectedInMultiOption && (
                                    <div className="h-2 w-2 rounded-full bg-white" />
                                  )}
                                </button>
                              )}
                              {onRemoveItem && option.items.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-gray-400 hover:text-destructive flex-shrink-0"
                                  onClick={() => onRemoveItem(option.id, item.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                              <span>{item.customName}</span>
                              {isDefaultItem && isOptionalOrUpsell && (
                                <span className="text-xs text-amber-600">✓</span>
                              )}
                            </div>
                            {editingItemPrice?.optionId === option.id && editingItemPrice?.itemId === item.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  value={editingItemPrice.value}
                                  onChange={(e) => setEditingItemPrice({ ...editingItemPrice, value: e.target.value })}
                                  className="w-20 h-6 text-right text-xs"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleApplyEditedItemPrice(option);
                                    if (e.key === 'Escape') setEditingItemPrice(null);
                                  }}
                                  onBlur={() => handleApplyEditedItemPrice(option)}
                                />
                                <span className="text-xs text-muted-foreground">zł</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartEditItemPrice(option.id, item.id, item.unitPrice)}
                                className="font-medium hover:bg-hover rounded px-1 transition-colors cursor-pointer"
                                title={t('summaryStep.clickToEdit')}
                              >
                                {formatPrice(itemValue)}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Discount section */}
                  <div className="pt-2">
                    {isEditingThisOption ? (
                      <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                        <RadioGroup
                          value={discountEditing.type}
                          onValueChange={(val) => setDiscountEditing({
                            ...discountEditing,
                            type: val as 'percent' | 'amount',
                          })}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="percent" id={`percent-${option.id}`} />
                            <Label htmlFor={`percent-${option.id}`} className="text-sm cursor-pointer">
                              {t('summaryStep.percentDiscount')}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="amount" id={`amount-${option.id}`} />
                            <Label htmlFor={`amount-${option.id}`} className="text-sm cursor-pointer">
                              {t('summaryStep.amountDiscount')}
                            </Label>
                          </div>
                        </RadioGroup>
                        
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={discountEditing.value}
                            onChange={(e) => setDiscountEditing({
                              ...discountEditing,
                              value: e.target.value,
                            })}
                            className="w-24 h-8"
                            min={0}
                            max={discountEditing.type === 'percent' ? 100 : undefined}
                          />
                          <span className="text-sm text-muted-foreground">
                            {discountEditing.type === 'percent' ? '%' : 'zł'}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleApplyDiscount(option)}
                          >
                            {t('summaryStep.apply')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDiscountEditing(null)}
                          >
                            {t('common.cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDiscount(option.id)}
                          className="gap-1 text-muted-foreground"
                        >
                          <Tag className="w-3 h-3" />
                          {optionHasDiscount ? t('summaryStep.changeDiscount') : t('summaryStep.addDiscount')}
                        </Button>
                        {optionHasDiscount && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDiscount(option.id, option)}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                            {t('summaryStep.removeDiscount')}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}


      {/* Totals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="w-4 h-4 text-primary" />
            {t('summaryStep.totalSummary')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('summaryStep.netTotal')}</span>
              <span className="font-medium">-</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span>{t('summaryStep.vat')}</span>
                <Select
                  value={offer.vatRate.toString()}
                  onValueChange={(val) => onUpdateOffer({ vatRate: parseInt(val) })}
                >
                  <SelectTrigger className="w-20 h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="23">23%</SelectItem>
                    <SelectItem value="8">8%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="0">0%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span className="font-medium">-</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offer validity + Additional conditions */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="validUntil">{t('summaryStep.validUntil')}</Label>
            <Input
              id="validUntil"
              type="date"
              value={offer.validUntil || ''}
              onChange={(e) => onUpdateOffer({ validUntil: e.target.value })}
            />
          </div>

          <Collapsible open={conditionsOpen} onOpenChange={setConditionsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                <span className="text-sm font-medium">{t('summaryStep.additionalConditions')}</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  conditionsOpen && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {templates.length > 0 && (
                <div className="flex items-center justify-end">
                  <Select onValueChange={(id) => {
                    const template = templates.find(t => t.id === id);
                    if (template) handleApplyTemplate(template);
                  }}>
                    <SelectTrigger className="w-auto h-8">
                      <span className="text-sm">{t('summaryStep.loadTemplate')}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(tmpl => (
                        <SelectItem key={tmpl.id} value={tmpl.id}>{tmpl.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">{t('summaryStep.paymentTerms')}</Label>
                <Textarea
                  id="paymentTerms"
                  value={offer.paymentTerms || ''}
                  onChange={(e) => onUpdateOffer({ paymentTerms: e.target.value })}
                  rows={4}
                  placeholder={t('summaryStep.paymentTermsPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warranty">{t('summaryStep.warrantyTerms')}</Label>
                <Textarea
                  id="warranty"
                  value={offer.warranty || ''}
                  onChange={(e) => onUpdateOffer({ warranty: e.target.value })}
                  rows={4}
                  placeholder={t('summaryStep.warrantyPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceInfo">{t('summaryStep.offerIncludes')}</Label>
                <Textarea
                  id="serviceInfo"
                  value={offer.serviceInfo || ''}
                  onChange={(e) => onUpdateOffer({ serviceInfo: e.target.value })}
                  rows={4}
                  placeholder={t('summaryStep.offerIncludesPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t('summaryStep.otherInfo')}</Label>
                <Textarea
                  id="notes"
                  value={offer.notes || ''}
                  onChange={(e) => onUpdateOffer({ notes: e.target.value })}
                  rows={4}
                  placeholder={t('summaryStep.otherInfoPlaceholder')}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
};
