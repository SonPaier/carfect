import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HallReservationCard from "./HallReservationCard";

// PhotoFullscreenDialog uses Radix Dialog and opens when a photo is clicked.
// Mock it to avoid portal/Dialog complexity in unit tests.
vi.mock("@/components/protocols/PhotoFullscreenDialog", () => ({
  PhotoFullscreenDialog: () => null,
}));

// ConfirmDialog is only rendered as a confirm prompt. Mock to keep tests simple.
vi.mock("@shared/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/ui")>();
  return {
    ...actual,
    ConfirmDialog: ({ open, onConfirm, title }: { open: boolean; onConfirm: () => void; title: string }) =>
      open ? <div data-testid="confirm-dialog">{title}<button onClick={onConfirm}>Confirm</button></div> : null,
  };
});

const baseReservation = {
  id: "res-1",
  customer_name: "Jan Kowalski",
  customer_phone: "+48733854184",
  vehicle_plate: "WX 12345",
  reservation_date: "2026-04-05",
  start_time: "09:00:00",
  end_time: "10:00:00",
  status: "pending",
  instance_id: "inst-1",
  services_data: [
    { id: "svc-1", name: "Myjnia" },
    { id: "svc-2", name: "Polerowanie" },
  ],
  admin_notes: "Ważna notatka",
  price: 150,
};

const defaultHandlers = {
  open: true,
  onClose: vi.fn(),
  onStartWork: vi.fn().mockResolvedValue(undefined),
  onEndWork: vi.fn().mockResolvedValue(undefined),
  onSendPickupSms: vi.fn().mockResolvedValue(undefined),
  onAddService: vi.fn(),
  onServiceToggle: vi.fn().mockResolvedValue(undefined),
  onRemoveService: vi.fn().mockResolvedValue(undefined),
};

type RenderCardOverrides = Partial<
  Omit<React.ComponentProps<typeof HallReservationCard>, "reservation"> & {
    reservation: Partial<typeof baseReservation>;
  }
>;

const renderCard = (overrides: RenderCardOverrides = {}) => {
  const { reservation: reservationOverride, ...rest } = overrides;
  const reservation = { ...baseReservation, ...reservationOverride };
  return render(
    <HallReservationCard
      reservation={reservation}
      {...defaultHandlers}
      {...rest}
    />
  );
};

describe("HallReservationCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // GROUP A: Default behavior (no visibleFields/allowedActions passed)
  // ========================================
  describe("default behavior — everything visible and enabled", () => {
    it("renders customer name by default", () => {
      renderCard();
      expect(screen.getByText(/Jan Kowalski/)).toBeInTheDocument();
    });

    it("renders vehicle plate by default", () => {
      renderCard();
      expect(screen.getByText("WX 12345")).toBeInTheDocument();
    });

    it("renders services list by default", () => {
      renderCard();
      expect(screen.getByText(/Myjnia/)).toBeInTheDocument();
      expect(screen.getByText(/Polerowanie/)).toBeInTheDocument();
    });

    it("renders admin_notes by default", () => {
      renderCard();
      expect(screen.getByText("Ważna notatka")).toBeInTheDocument();
    });

    it("renders price by default when price is set", () => {
      renderCard();
      expect(screen.getByText(/150\.00 zł/)).toBeInTheDocument();
    });

    it("renders Usługi button by default", () => {
      renderCard();
      expect(screen.getByText("Usługi")).toBeInTheDocument();
    });

    it("renders service trash buttons by default", () => {
      renderCard();
      // Each service with an id gets a trash icon button
      const trashButtons = document.querySelectorAll("svg.lucide-trash2");
      expect(trashButtons.length).toBe(2);
    });

    it("does not render when open=false", () => {
      renderCard({ open: false });
      expect(screen.queryByText(/Jan Kowalski/)).not.toBeInTheDocument();
    });
  });

  // ========================================
  // GROUP B: visibleFields.customer_name
  // ========================================
  describe("visibleFields.customer_name", () => {
    it("hides customer name when customer_name=false", () => {
      renderCard({
        visibleFields: {
          customer_name: false,
          customer_phone: true,
          vehicle_plate: true,
          services: true,
          admin_notes: true,
          price: true,
        },
      });
      expect(screen.queryByText(/Jan Kowalski/)).not.toBeInTheDocument();
    });

    it("shows customer name when customer_name=true", () => {
      renderCard({
        visibleFields: {
          customer_name: true,
          customer_phone: true,
          vehicle_plate: true,
          services: true,
          admin_notes: true,
          price: true,
        },
      });
      expect(screen.getByText(/Jan Kowalski/)).toBeInTheDocument();
    });
  });

  // ========================================
  // GROUP C: visibleFields.customer_phone
  // ========================================
  describe("visibleFields.customer_phone", () => {
    it("hides customer phone when customer_phone=false", () => {
      renderCard({
        visibleFields: {
          customer_name: true,
          customer_phone: false,
          vehicle_plate: true,
          services: true,
          admin_notes: true,
          price: true,
        },
      });
      // formatPhoneDisplay('+48733854184') => '733 854 184'
      expect(screen.queryByText(/733 854 184/)).not.toBeInTheDocument();
    });

    it("shows formatted phone when customer_phone=true", () => {
      renderCard({
        visibleFields: {
          customer_name: true,
          customer_phone: true,
          vehicle_plate: true,
          services: true,
          admin_notes: true,
          price: true,
        },
      });
      expect(screen.getByText(/733 854 184/)).toBeInTheDocument();
    });
  });

  // ========================================
  // GROUP D: visibleFields.vehicle_plate
  // ========================================
  describe("visibleFields.vehicle_plate", () => {
    it("hides vehicle plate when vehicle_plate=false", () => {
      renderCard({
        visibleFields: {
          customer_name: true,
          customer_phone: true,
          vehicle_plate: false,
          services: true,
          admin_notes: true,
          price: true,
        },
      });
      expect(screen.queryByText("WX 12345")).not.toBeInTheDocument();
    });

    it("shows vehicle plate when vehicle_plate=true", () => {
      renderCard({
        visibleFields: {
          customer_name: true,
          customer_phone: true,
          vehicle_plate: true,
          services: true,
          admin_notes: true,
          price: true,
        },
      });
      expect(screen.getByText("WX 12345")).toBeInTheDocument();
    });
  });

  // ========================================
  // GROUP E: visibleFields.services
  // ========================================
  describe("visibleFields.services", () => {
    it("hides services list when services=false", () => {
      renderCard({
        visibleFields: {
          customer_name: true,
          customer_phone: true,
          vehicle_plate: true,
          services: false,
          admin_notes: true,
          price: true,
        },
      });
      expect(screen.queryByText(/Myjnia/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Polerowanie/)).not.toBeInTheDocument();
    });

    it("shows services when services=true", () => {
      renderCard({
        visibleFields: {
          customer_name: true,
          customer_phone: true,
          vehicle_plate: true,
          services: true,
          admin_notes: true,
          price: true,
        },
      });
      expect(screen.getByText(/Myjnia/)).toBeInTheDocument();
    });
  });

  // ========================================
  // GROUP F: visibleFields.admin_notes
  // ========================================
  describe("visibleFields.admin_notes", () => {
    it("hides admin notes when admin_notes=false", () => {
      renderCard({
        visibleFields: {
          customer_name: true,
          customer_phone: true,
          vehicle_plate: true,
          services: true,
          admin_notes: false,
          price: true,
        },
      });
      expect(screen.queryByText("Ważna notatka")).not.toBeInTheDocument();
    });

    it("shows admin notes when admin_notes=true and notes exist", () => {
      renderCard({
        visibleFields: {
          customer_name: true,
          customer_phone: true,
          vehicle_plate: true,
          services: true,
          admin_notes: true,
          price: true,
        },
      });
      expect(screen.getByText("Ważna notatka")).toBeInTheDocument();
    });

    it("does not show admin notes section when admin_notes is null even if field is visible", () => {
      renderCard({
        reservation: { admin_notes: null },
        visibleFields: {
          customer_name: true,
          customer_phone: true,
          vehicle_plate: true,
          services: true,
          admin_notes: true,
          price: true,
        },
      });
      expect(screen.queryByText("Ważna notatka")).not.toBeInTheDocument();
    });
  });

  // ========================================
  // GROUP G: visibleFields.price
  // ========================================
  describe("visibleFields.price", () => {
    it("hides price when price=false", () => {
      renderCard({
        visibleFields: {
          customer_name: true,
          customer_phone: true,
          vehicle_plate: true,
          services: true,
          admin_notes: true,
          price: false,
        },
      });
      expect(screen.queryByText(/150\.00 zł/)).not.toBeInTheDocument();
    });

    it("shows price when price=true and price exists", () => {
      renderCard({
        visibleFields: {
          customer_name: true,
          customer_phone: true,
          vehicle_plate: true,
          services: true,
          admin_notes: true,
          price: true,
        },
      });
      expect(screen.getByText(/150\.00 zł/)).toBeInTheDocument();
    });

    it("does not show price when price=true but price is null", () => {
      renderCard({
        reservation: { price: null },
        visibleFields: {
          customer_name: true,
          customer_phone: true,
          vehicle_plate: true,
          services: true,
          admin_notes: true,
          price: true,
        },
      });
      expect(screen.queryByText(/zł/)).not.toBeInTheDocument();
    });
  });

  // ========================================
  // GROUP H: allowedActions.add_services — Usługi button
  // ========================================
  describe("allowedActions.add_services — Usługi button", () => {
    it("hides Usługi button when add_services=false", () => {
      renderCard({
        allowedActions: {
          add_services: false,
          change_time: true,
          change_station: true,
          edit_reservation: true,
          delete_reservation: true,
        },
      });
      expect(screen.queryByText("Usługi")).not.toBeInTheDocument();
    });

    it("shows Usługi button when add_services=true and onAddService provided", () => {
      renderCard({
        allowedActions: {
          add_services: true,
          change_time: true,
          change_station: true,
          edit_reservation: true,
          delete_reservation: true,
        },
      });
      expect(screen.getByText("Usługi")).toBeInTheDocument();
    });

    it("calls onAddService when Usługi button clicked", async () => {
      const user = userEvent.setup();
      const onAddService = vi.fn();
      renderCard({
        onAddService,
        allowedActions: {
          add_services: true,
          change_time: true,
          change_station: true,
          edit_reservation: true,
          delete_reservation: true,
        },
      });
      await user.click(screen.getByText("Usługi"));
      expect(onAddService).toHaveBeenCalledTimes(1);
    });
  });

  // ========================================
  // GROUP I: allowedActions.add_services — service toggle
  // ========================================
  describe("allowedActions.add_services — service toggle (click to check)", () => {
    it("service is not clickable when add_services=false", async () => {
      const user = userEvent.setup();
      const onServiceToggle = vi.fn().mockResolvedValue(undefined);
      renderCard({
        onServiceToggle,
        allowedActions: {
          add_services: false,
          change_time: true,
          change_station: true,
          edit_reservation: true,
          delete_reservation: true,
        },
      });
      // Click on service name text
      await user.click(screen.getByText(/1\. Myjnia/));
      expect(onServiceToggle).not.toHaveBeenCalled();
    });

    it("service is clickable and calls onServiceToggle when add_services=true", async () => {
      const user = userEvent.setup();
      const onServiceToggle = vi.fn().mockResolvedValue(undefined);
      renderCard({
        onServiceToggle,
        allowedActions: {
          add_services: true,
          change_time: true,
          change_station: true,
          edit_reservation: true,
          delete_reservation: true,
        },
      });
      await user.click(screen.getByText(/1\. Myjnia/));
      expect(onServiceToggle).toHaveBeenCalledWith("svc-1", true);
    });
  });

  // ========================================
  // GROUP J: allowedActions.add_services — trash delete button
  // ========================================
  describe("allowedActions.add_services — trash delete button", () => {
    it("hides trash buttons when add_services=false", () => {
      renderCard({
        allowedActions: {
          add_services: false,
          change_time: true,
          change_station: true,
          edit_reservation: true,
          delete_reservation: true,
        },
      });
      const trashButtons = document.querySelectorAll("svg.lucide-trash2");
      expect(trashButtons.length).toBe(0);
    });

    it("shows trash buttons when add_services=true", () => {
      renderCard({
        allowedActions: {
          add_services: true,
          change_time: true,
          change_station: true,
          edit_reservation: true,
          delete_reservation: true,
        },
      });
      const trashButtons = document.querySelectorAll("svg.lucide-trash2");
      expect(trashButtons.length).toBe(2);
    });

    it("clicking trash opens confirm dialog", async () => {
      const user = userEvent.setup();
      renderCard({
        allowedActions: {
          add_services: true,
          change_time: true,
          change_station: true,
          edit_reservation: true,
          delete_reservation: true,
        },
      });
      const trashButton = document.querySelectorAll("svg.lucide-trash2")[0].closest("button")!;
      await user.click(trashButton);
      expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
      expect(screen.getByText("Usunąć usługę?")).toBeInTheDocument();
    });

    it("confirming remove dialog calls onRemoveService", async () => {
      const user = userEvent.setup();
      const onRemoveService = vi.fn().mockResolvedValue(undefined);
      renderCard({
        onRemoveService,
        allowedActions: {
          add_services: true,
          change_time: true,
          change_station: true,
          edit_reservation: true,
          delete_reservation: true,
        },
      });
      const trashButton = document.querySelectorAll("svg.lucide-trash2")[0].closest("button")!;
      await user.click(trashButton);
      await user.click(screen.getByText("Confirm"));
      expect(onRemoveService).toHaveBeenCalledWith("svc-1", "Myjnia");
    });
  });

  // ========================================
  // GROUP K: Time and date display
  // ========================================
  describe("time and date display", () => {
    it("shows formatted time range", () => {
      renderCard();
      expect(screen.getByText(/09:00 - 10:00/)).toBeInTheDocument();
    });

    it("shows single date in long format", () => {
      renderCard();
      // 5 kwietnia 2026 in Polish
      expect(screen.getByText(/5 kwietnia 2026/)).toBeInTheDocument();
    });

    it("shows date range when end_date differs from reservation_date", () => {
      renderCard({
        reservation: {
          reservation_date: "2026-04-05",
          end_date: "2026-04-07",
        },
      });
      expect(screen.getByText(/5 kwi/)).toBeInTheDocument();
      expect(screen.getByText(/7 kwi 2026/)).toBeInTheDocument();
    });
  });

  // ========================================
  // GROUP L: Status-based action buttons
  // ========================================
  describe("status-based action buttons", () => {
    it("shows START button for pending status", () => {
      renderCard({ reservation: { status: "pending" } });
      expect(screen.getByText("START")).toBeInTheDocument();
    });

    it("shows START button for confirmed status", () => {
      renderCard({ reservation: { status: "confirmed" } });
      expect(screen.getByText("START")).toBeInTheDocument();
    });

    it("shows STOP button for in_progress status", () => {
      renderCard({ reservation: { status: "in_progress" } });
      expect(screen.getByText("STOP")).toBeInTheDocument();
    });

    it("shows SMS button for completed status", () => {
      renderCard({ reservation: { status: "completed" } });
      expect(screen.getByText(/Wyślij SMS/)).toBeInTheDocument();
    });

    it("shows Zamknij button for cancelled status", () => {
      renderCard({ reservation: { status: "cancelled" } });
      expect(screen.getByText("Zamknij")).toBeInTheDocument();
    });

    it("clicking START calls onStartWork with reservation id", async () => {
      const user = userEvent.setup();
      const onStartWork = vi.fn().mockResolvedValue(undefined);
      renderCard({ onStartWork, reservation: { status: "pending" } });
      await user.click(screen.getByText("START"));
      expect(onStartWork).toHaveBeenCalledWith("res-1");
    });

    it("clicking STOP calls onEndWork with reservation id", async () => {
      const user = userEvent.setup();
      const onEndWork = vi.fn().mockResolvedValue(undefined);
      renderCard({ onEndWork, reservation: { status: "in_progress" } });
      await user.click(screen.getByText("STOP"));
      expect(onEndWork).toHaveBeenCalledWith("res-1");
    });
  });

  // ========================================
  // GROUP M: Close button
  // ========================================
  describe("close button", () => {
    it("calls onClose when X button clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderCard({ onClose });
      const xButton = document.querySelector("svg.lucide-x")?.closest("button");
      expect(xButton).toBeInTheDocument();
      await user.click(xButton!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
