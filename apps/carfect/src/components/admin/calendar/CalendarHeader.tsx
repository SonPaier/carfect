import { useTranslation } from 'react-i18next';
import { format, addDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  Settings2,
  CalendarOff,
  ParkingSquare,
  Loader2,
  ClipboardCheck,
  Maximize2,
  Minimize2,
  ChevronsLeftRight,
} from 'lucide-react';
import { Sheet, SheetContent } from '@shared/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui';
import { Button } from '@shared/ui';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui';
import { Checkbox } from '@shared/ui';
import { Label } from '@shared/ui';
import { Calendar } from '@shared/ui';
import type { GroupBy } from './types';

type ViewMode = 'day' | 'week' | 'month';

interface Station {
  id: string;
  name: string;
  type: string;
  color?: string | null;
}

export interface CalendarHeaderProps {
  // Date & view state
  currentDate: Date;
  viewMode: ViewMode;
  groupingMode: GroupBy;
  weekStart: Date;
  isMobile: boolean;
  isToday: boolean;
  currentDateClosed: boolean;

  // Mode flags
  hallMode: boolean;
  readOnly: boolean;
  hallDataVisible: boolean;
  allowedViews: ViewMode[];
  showWeekView: boolean;
  showStationFilter: boolean;
  hasHiddenStations: boolean;
  isFullscreen: boolean;
  isCompact: boolean;
  isLoadingMore: boolean;

  // Station filter
  stations: Station[];
  hiddenStationIds: Set<string>;

  // Dialog open state
  datePickerOpen: boolean;
  closeDayDialogOpen: boolean;

  // Hall / protocols
  showProtocolsButton: boolean;
  yardVehicleCount: number;

  // Optional callbacks that may not always be provided
  onToggleClosedDay?: (date: string) => void;
  onToggleHallDataVisibility?: () => void;
  onProtocolsClick?: () => void;

  // Navigation handlers
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;

  // Date / view setters
  onDateSelect: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onGroupingModeChange: (mode: GroupBy) => void;
  onDatePickerOpenChange: (open: boolean) => void;
  onCloseDayDialogOpenChange: (open: boolean) => void;

  // Station filter handlers
  onToggleStation: (stationId: string) => void;
  onShowAllStations: () => void;

  // Compact / fullscreen
  onToggleCompact: () => void;
  onToggleFullscreen: () => void;

  // Plac drawer
  onPlacDrawerOpen: () => void;

  // View preference persistence
  onSaveDefaultView: (mode: ViewMode) => void;
}

export function CalendarHeader({
  currentDate,
  viewMode,
  groupingMode,
  weekStart,
  isMobile,
  isToday,
  currentDateClosed,
  hallMode,
  readOnly,
  hallDataVisible,
  allowedViews,
  showWeekView,
  showStationFilter,
  hasHiddenStations,
  isFullscreen,
  isCompact,
  isLoadingMore,
  stations,
  hiddenStationIds,
  datePickerOpen,
  showProtocolsButton,
  yardVehicleCount,
  onToggleClosedDay,
  onToggleHallDataVisibility,
  onProtocolsClick,
  onPrev,
  onNext,
  onToday,
  onDateSelect,
  onViewModeChange,
  onGroupingModeChange,
  onDatePickerOpenChange,
  onCloseDayDialogOpenChange,
  onToggleStation,
  onShowAllStations,
  onToggleCompact,
  onToggleFullscreen,
  onPlacDrawerOpen,
  onSaveDefaultView,
}: CalendarHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col py-2 lg:py-3 bg-background sticky top-0 z-50 gap-2 mx-0">
      {/* First line on mobile: navigation + actions, on desktop: full layout */}
      <div className="flex items-center justify-between gap-2">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onPrev} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onNext} className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            className={cn(hallMode && 'hidden sm:flex')}
          >
            Dziś
          </Button>
          {isLoadingMore && (
            <div className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="hidden sm:inline">Ładowanie...</span>
            </div>
          )}
          {/* Date picker button */}
          {isMobile ? (
            <Button variant="outline" size="sm" onClick={() => onDatePickerOpenChange(true)}>
              <CalendarIcon className="w-4 h-4" />
            </Button>
          ) : (
            <Popover open={datePickerOpen} onOpenChange={onDatePickerOpenChange}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Data</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => {
                    if (date) {
                      onDateSelect(date);
                      onViewModeChange('day');
                      onDatePickerOpenChange(false);
                    }
                  }}
                  initialFocus
                  className="pointer-events-auto"
                  locale={pl}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Day name - only visible on desktop in header row */}
        {!isMobile &&
          (viewMode === 'day' && !readOnly && onToggleClosedDay ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'text-lg font-semibold cursor-pointer',
                    isToday && 'text-primary',
                    currentDateClosed && 'text-red-500',
                    hallMode && 'flex-1 text-center',
                  )}
                >
                  {format(currentDate, 'EEEE, d MMMM', { locale: pl })}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="bg-popover">
                <DropdownMenuItem
                  onClick={() => onCloseDayDialogOpenChange(true)}
                  className={cn(currentDateClosed ? 'text-emerald-600' : 'text-destructive')}
                >
                  {currentDateClosed ? (
                    <>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {t('calendar.openDay')}
                    </>
                  ) : (
                    <>
                      <CalendarOff className="w-4 h-4 mr-2" />
                      {t('calendar.closeDay')}
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <h2
              className={cn(
                'text-lg font-semibold',
                isToday && 'text-primary',
                currentDateClosed && viewMode === 'day' && 'text-red-500',
                hallMode && 'flex-1 text-center',
              )}
            >
              {viewMode === 'month'
                ? format(currentDate, 'LLLL yyyy', { locale: pl })
                : viewMode === 'week'
                  ? `${format(weekStart, 'd MMM', { locale: pl })} - ${format(addDays(weekStart, 6), 'd MMM', { locale: pl })}`
                  : format(currentDate, 'EEEE, d MMMM', { locale: pl })}
            </h2>
          ))}

        <div className="flex items-center gap-2">
          {/* Station selector removed - week tile view shows all stations via color */}

          {/* View mode toggle - icons only */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            {allowedViews.includes('day') && (
              <Button
                variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => { onViewModeChange('day'); onSaveDefaultView('day'); }}
                className="rounded-none border-0 px-2.5"
                title="Dzień"
              >
                <CalendarIcon className="w-4 h-4" />
              </Button>
            )}
            {allowedViews.includes('week') && showWeekView && (
              <Button
                variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => {
                  onViewModeChange('week');
                  onSaveDefaultView('week');
                }}
                className="rounded-none border-0 px-2.5"
                title="Tydzień"
              >
                <CalendarDays className="w-4 h-4" />
              </Button>
            )}
            {allowedViews.includes('month') && (
              <Button
                variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => {
                  onViewModeChange('month');
                  onSaveDefaultView('month');
                }}
                className="rounded-none border-0 px-2.5"
                title="Miesiąc"
              >
                <CalendarRange className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Column visibility settings - only show if not read only */}
          {showStationFilter && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9" title="Kolumny">
                  <Settings2 className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-3 z-[300]">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">Widoczność kolumn</h4>
                      <p className="text-[10px] text-muted-foreground">
                        {viewMode === 'day' ? 'Widok dzienny' : viewMode === 'week' ? 'Widok tygodniowy' : 'Widok miesięczny'}
                      </p>
                    </div>
                    {hasHiddenStations && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onShowAllStations}
                        className="h-7 text-xs"
                      >
                        Pokaż wszystkie
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {stations.map((station) => (
                      <div key={station.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`station-${station.id}`}
                          checked={!hiddenStationIds.has(station.id)}
                          onCheckedChange={() => onToggleStation(station.id)}
                        />
                        <Label
                          htmlFor={`station-${station.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {station.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Default view preference */}
                <div className="border-t border-border pt-3 space-y-2">
                  <h4 className="font-medium text-sm">Domyślny widok</h4>
                  <div className="space-y-1">
                    {(['day', 'week', 'month'] as const).map((v) => (
                      <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="default-view"
                          value={v}
                          checked={viewMode === v}
                          onChange={() => { onViewModeChange(v); onSaveDefaultView(v); }}
                          className="accent-primary"
                        />
                        {v === 'day' ? 'Dzień' : v === 'week' ? 'Tydzień' : 'Miesiąc'}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Grouping mode for week/month views */}
                <div className="border-t border-border pt-3 space-y-2">
                  <h4 className="font-medium text-sm">Grupowanie (tydzień/miesiąc)</h4>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="grouping-mode"
                        value="station"
                        checked={groupingMode === 'station'}
                        onChange={() => onGroupingModeChange('station')}
                        className="accent-primary"
                      />
                      Wg stanowiska
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="grouping-mode"
                        value="employee"
                        checked={groupingMode === 'employee'}
                        onChange={() => onGroupingModeChange('employee')}
                        className="accent-primary"
                      />
                      Wg pracownika
                    </label>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Eye toggle for hall mode - show/hide sensitive data */}
          {hallMode && onToggleHallDataVisibility && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={onToggleHallDataVisibility}
              title={hallDataVisible ? 'Ukryj dane klienta' : 'Pokaż dane klienta'}
            >
              {hallDataVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
          )}

          {/* Compact mode toggle - desktop only */}
          {!isMobile && (
            <Button
              variant={isCompact ? 'secondary' : 'outline'}
              size="sm"
              onClick={onToggleCompact}
              className="gap-1 h-9"
              title={isCompact ? 'Rozwiń kolumny' : 'Zwiń kolumny'}
            >
              <ChevronsLeftRight className="w-4 h-4" />
            </Button>
          )}

          {/* Plac button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onPlacDrawerOpen}
            className="gap-1 h-9 relative"
          >
            <ParkingSquare className="w-4 h-4" />
            <span className="hidden md:inline">Plac</span>
            {yardVehicleCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {yardVehicleCount > 99 ? '99+' : yardVehicleCount}
              </span>
            )}
          </Button>

          {/* Protocols button - only in hall mode when enabled */}
          {showProtocolsButton && onProtocolsClick && (
            <Button variant="outline" size="sm" onClick={onProtocolsClick} className="gap-1">
              <ClipboardCheck className="w-4 h-4" />
              <span className="hidden md:inline">Protokół</span>
            </Button>
          )}

          {/* Fullscreen button - in hall mode */}
          {hallMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFullscreen}
              className="gap-1"
              title={isFullscreen ? t('calendar.exitFullscreen') : t('calendar.enterFullscreen')}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Second line on mobile: day name centered with dropdown for day options */}
      {isMobile &&
        (viewMode === 'day' && !readOnly && onToggleClosedDay ? (
          <>
            <button
              onClick={() => onDatePickerOpenChange(true)}
              className={cn(
                'text-lg font-semibold cursor-pointer text-center w-full',
                isToday && 'text-primary',
                currentDateClosed && 'text-red-500',
              )}
            >
              {format(currentDate, 'EEEE, d MMMM', { locale: pl })}
            </button>
            <Sheet open={datePickerOpen} onOpenChange={onDatePickerOpenChange}>
              <SheetContent side="bottom" className="px-4 pb-8" hideCloseButton>
                <div className="flex flex-col items-center gap-4">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={(date) => {
                      if (date) {
                        onDateSelect(date);
                        onViewModeChange('day');
                        onDatePickerOpenChange(false);
                      }
                    }}
                    className="pointer-events-auto"
                    locale={pl}
                  />

                  <Button
                    variant={currentDateClosed ? 'outline' : 'destructive'}
                    className="w-full"
                    onClick={() => {
                      onDatePickerOpenChange(false);
                      onCloseDayDialogOpenChange(true);
                    }}
                  >
                    {currentDateClosed ? (
                      <>
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {t('calendar.openDay')}
                      </>
                    ) : (
                      <>
                        <CalendarOff className="w-4 h-4 mr-2" />
                        {t('calendar.closeDay')}
                      </>
                    )}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <>
            <button
              onClick={() => onDatePickerOpenChange(true)}
              className={cn(
                'text-lg font-semibold cursor-pointer hover:opacity-80 transition-opacity text-center w-full',
                isToday && 'text-primary',
                currentDateClosed && viewMode === 'day' && 'text-red-500',
              )}
            >
              {viewMode === 'week'
                ? `${format(weekStart, 'd MMM', { locale: pl })} - ${format(addDays(weekStart, 6), 'd MMM', { locale: pl })}`
                : format(currentDate, 'EEEE, d MMMM', { locale: pl })}
            </button>
            <Sheet open={datePickerOpen} onOpenChange={onDatePickerOpenChange}>
              <SheetContent side="bottom" className="px-4 pb-8" hideCloseButton>
                <div className="flex flex-col items-center gap-4">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={(date) => {
                      if (date) {
                        onDateSelect(date);
                        onViewModeChange('day');
                        onDatePickerOpenChange(false);
                      }
                    }}
                    className="pointer-events-auto"
                    locale={pl}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </>
        ))}
    </div>
  );
}
