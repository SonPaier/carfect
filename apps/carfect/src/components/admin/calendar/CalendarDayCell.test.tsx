import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarDayCell } from './CalendarDayCell';
import type { Reservation, Station, DragHandlers } from './types';

// Mock shared-ui — preserve all real exports, just pin useIsMobile to desktop
vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 'res-1',
    customer_name: 'Jan Kowalski',
    vehicle_plate: 'WA12345',
    reservation_date: '2026-04-10',
    start_time: '09:00:00',
    end_time: '10:00:00',
    status: 'confirmed',
    station_id: null,
    assigned_employee_ids: null,
    ...overrides,
  };
}

function makeStation(overrides: Partial<Station> = {}): Station {
  return {
    id: 'sta-1',
    name: 'Station A',
    type: 'washing',
    color: '#ff0000',
    ...overrides,
  };
}

const NO_OP_DRAG: DragHandlers = {
  onDragStart: vi.fn(),
  onDragEnd: vi.fn(),
  onDragOver: vi.fn(),
  onDragLeave: vi.fn(),
  onDrop: vi.fn(),
  draggedId: null,
  dragOverDate: null,
};

const TEST_DATE = new Date('2026-04-10');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CalendarDayCell — groupBy=none (flat)', () => {
  beforeEach(() => {
    userEvent.setup();
  });

  it('renders all reservations flat without section headers', () => {
    const reservations = [
      makeReservation({ id: 'res-1', customer_name: 'Alice', station_id: 'sta-1' }),
      makeReservation({ id: 'res-2', customer_name: 'Bob', station_id: 'sta-2' }),
    ];
    const stations = [
      makeStation({ id: 'sta-1', name: 'Station A' }),
      makeStation({ id: 'sta-2', name: 'Station B' }),
    ];

    render(
      <CalendarDayCell
        date={TEST_DATE}
        reservations={reservations}
        stations={stations}
        isToday={false}
        isClosed={false}
        onDayClick={vi.fn()}
        onReservationClick={vi.fn()}
        dragHandlers={NO_OP_DRAG}
        groupBy="none"
      />,
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    // Station headers must not appear when groupBy='none'
    expect(screen.queryByText('Station A')).not.toBeInTheDocument();
    expect(screen.queryByText('Station B')).not.toBeInTheDocument();
  });
});

describe('CalendarDayCell — groupBy=station', () => {
  beforeEach(() => {
    userEvent.setup();
  });

  it('renders station name headers and groups reservations under the correct station', () => {
    const reservations = [
      makeReservation({ id: 'res-1', customer_name: 'Alice', station_id: 'sta-1' }),
      makeReservation({ id: 'res-2', customer_name: 'Bob', station_id: 'sta-2' }),
    ];
    const stations = [
      makeStation({ id: 'sta-1', name: 'Station Alpha' }),
      makeStation({ id: 'sta-2', name: 'Station Beta' }),
    ];

    render(
      <CalendarDayCell
        date={TEST_DATE}
        reservations={reservations}
        stations={stations}
        isToday={false}
        isClosed={false}
        onDayClick={vi.fn()}
        onReservationClick={vi.fn()}
        dragHandlers={NO_OP_DRAG}
        groupBy="station"
      />,
    );

    expect(screen.getByText('Station Alpha')).toBeInTheDocument();
    expect(screen.getByText('Station Beta')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('does not render a section header for stations that have no reservations', () => {
    const reservations = [
      makeReservation({ id: 'res-1', customer_name: 'Alice', station_id: 'sta-1' }),
    ];
    const stations = [
      makeStation({ id: 'sta-1', name: 'Station Alpha' }),
      makeStation({ id: 'sta-2', name: 'Station Empty' }),
    ];

    render(
      <CalendarDayCell
        date={TEST_DATE}
        reservations={reservations}
        stations={stations}
        isToday={false}
        isClosed={false}
        onDayClick={vi.fn()}
        onReservationClick={vi.fn()}
        dragHandlers={NO_OP_DRAG}
        groupBy="station"
      />,
    );

    expect(screen.getByText('Station Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Station Empty')).not.toBeInTheDocument();
  });

  it('renders "Bez stanowiska" header for reservations without a station', () => {
    const reservations = [
      makeReservation({ id: 'res-1', customer_name: 'NoStation', station_id: null }),
    ];
    const stations = [makeStation({ id: 'sta-1', name: 'Station Alpha' })];

    render(
      <CalendarDayCell
        date={TEST_DATE}
        reservations={reservations}
        stations={stations}
        isToday={false}
        isClosed={false}
        onDayClick={vi.fn()}
        onReservationClick={vi.fn()}
        dragHandlers={NO_OP_DRAG}
        groupBy="station"
      />,
    );

    expect(screen.getByText('Bez stanowiska')).toBeInTheDocument();
    expect(screen.getByText('NoStation')).toBeInTheDocument();
  });
});

describe('CalendarDayCell — groupBy=employee', () => {
  beforeEach(() => {
    userEvent.setup();
  });

  it('renders employee name headers for assigned reservations', () => {
    const employees = [
      { id: 'emp-1', name: 'Marek Nowak' },
      { id: 'emp-2', name: 'Ewa Kowalska' },
    ];
    const reservations = [
      makeReservation({ id: 'res-1', customer_name: 'Client A', assigned_employee_ids: ['emp-1'] }),
      makeReservation({ id: 'res-2', customer_name: 'Client B', assigned_employee_ids: ['emp-2'] }),
    ];

    render(
      <CalendarDayCell
        date={TEST_DATE}
        reservations={reservations}
        stations={[]}
        isToday={false}
        isClosed={false}
        onDayClick={vi.fn()}
        onReservationClick={vi.fn()}
        dragHandlers={NO_OP_DRAG}
        groupBy="employee"
        employees={employees}
      />,
    );

    expect(screen.getByText('Marek Nowak')).toBeInTheDocument();
    expect(screen.getByText('Ewa Kowalska')).toBeInTheDocument();
  });

  it('places a reservation under both employees when it has two assigned employee ids', () => {
    const employees = [
      { id: 'emp-1', name: 'Marek Nowak' },
      { id: 'emp-2', name: 'Ewa Kowalska' },
    ];
    const reservations = [
      makeReservation({
        id: 'res-1',
        customer_name: 'SharedClient',
        assigned_employee_ids: ['emp-1', 'emp-2'],
      }),
    ];

    render(
      <CalendarDayCell
        date={TEST_DATE}
        reservations={reservations}
        stations={[]}
        isToday={false}
        isClosed={false}
        onDayClick={vi.fn()}
        onReservationClick={vi.fn()}
        dragHandlers={NO_OP_DRAG}
        groupBy="employee"
        employees={employees}
      />,
    );

    expect(screen.getByText('Marek Nowak')).toBeInTheDocument();
    expect(screen.getByText('Ewa Kowalska')).toBeInTheDocument();
    // The customer tile appears twice — once under each employee
    const tiles = screen.getAllByText('SharedClient');
    expect(tiles).toHaveLength(2);
  });

  it('shows "Nieprzypisane" header for reservations with no assigned employees', () => {
    const reservations = [
      makeReservation({
        id: 'res-1',
        customer_name: 'UnassignedClient',
        assigned_employee_ids: [],
      }),
    ];

    render(
      <CalendarDayCell
        date={TEST_DATE}
        reservations={reservations}
        stations={[]}
        isToday={false}
        isClosed={false}
        onDayClick={vi.fn()}
        onReservationClick={vi.fn()}
        dragHandlers={NO_OP_DRAG}
        groupBy="employee"
        employees={[]}
      />,
    );

    expect(screen.getByText('Nieprzypisane')).toBeInTheDocument();
    expect(screen.getByText('UnassignedClient')).toBeInTheDocument();
  });

  it('shows "Nieprzypisane" header for reservations where assigned_employee_ids is null', () => {
    const reservations = [
      makeReservation({
        id: 'res-1',
        customer_name: 'NullAssigned',
        assigned_employee_ids: null,
      }),
    ];

    render(
      <CalendarDayCell
        date={TEST_DATE}
        reservations={reservations}
        stations={[]}
        isToday={false}
        isClosed={false}
        onDayClick={vi.fn()}
        onReservationClick={vi.fn()}
        dragHandlers={NO_OP_DRAG}
        groupBy="employee"
        employees={[]}
      />,
    );

    expect(screen.getByText('Nieprzypisane')).toBeInTheDocument();
  });
});
