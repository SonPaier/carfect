import { SLOT_HEIGHT, SLOTS_PER_HOUR, SLOT_MINUTES } from './useCalendarWorkingHours';

interface TimeColumnProps {
  hours: number[];
  startSlotOffset: number;
  displayEndTime: number;
}

export function TimeColumn({ hours, startSlotOffset, displayEndTime }: TimeColumnProps) {
  return (
    <div className="w-12 md:w-16 shrink-0 border-r border-border/50 sticky left-0 bg-card" style={{ zIndex: 250 }}>
      {hours.map((hour, hourIndex) => {
        const isFirstHour = hourIndex === 0;
        const isLastHour = hourIndex === hours.length - 1;
        const slotsToSkip = isFirstHour ? startSlotOffset : 0;
        const endSlotOffset = isLastHour
          ? Math.round((displayEndTime - hour) * SLOTS_PER_HOUR)
          : SLOTS_PER_HOUR;
        const slotsToRender = Math.max(0, endSlotOffset - slotsToSkip);

        if (slotsToRender <= 0) return null;
        const hourBlockHeight = slotsToRender * SLOT_HEIGHT;

        return (
          <div key={hour} className="relative" style={{ height: hourBlockHeight }}>
            {slotsToSkip === 0 ? (
              <span className="absolute -top-2.5 right-1 md:right-2 text-xs md:text-sm font-medium text-foreground bg-background px-1 z-10">
                {`${hour.toString().padStart(2, '0')}:00`}
              </span>
            ) : (
              <span className="absolute -top-2.5 right-1 md:right-2 text-xs md:text-sm font-medium text-foreground bg-background px-1 z-10">
                {`${hour.toString().padStart(2, '0')}:${(slotsToSkip * SLOT_MINUTES).toString().padStart(2, '0')}`}
              </span>
            )}
            <div className="absolute left-0 right-0 top-0 h-full">
              {Array.from({ length: slotsToRender }, (_, i) => {
                const actualSlotIndex = i + slotsToSkip;
                return (
                  <div
                    key={actualSlotIndex}
                    className={`border-b relative ${
                      actualSlotIndex === SLOTS_PER_HOUR - 1
                        ? 'border-border'
                        : 'border-border/30'
                    }`}
                    style={{ height: SLOT_HEIGHT }}
                  >
                    {i > 0 && (
                      <span className="absolute -top-1.5 right-1 md:right-2 text-[9px] md:text-[10px] text-muted-foreground/70 bg-background px-0.5">
                        {(actualSlotIndex * SLOT_MINUTES).toString()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
