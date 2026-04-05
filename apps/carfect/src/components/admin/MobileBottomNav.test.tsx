import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n/config";
import MobileBottomNav from "./MobileBottomNav";
import { setViewport, resetViewport } from "@/test/utils/viewport";

// Test wrapper with i18n
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

// Default props for rendering
const createDefaultProps = () => ({
  currentView: "calendar" as const,
  onViewChange: vi.fn(),
  onAddReservation: vi.fn(),
  onLogout: vi.fn(),
  unreadNotificationsCount: 0,
  offersEnabled: false,
  followupEnabled: false,
  hallViewEnabled: false,
  protocolsEnabled: false,
  userRole: "admin" as const,
  currentVersion: "1.0.0",
});

// Helper to render component
const renderNav = (props = {}) => {
  const defaultProps = createDefaultProps();
  const mergedProps = { ...defaultProps, ...props };
  return {
    ...render(
      <TestWrapper>
        <MobileBottomNav {...mergedProps} />
      </TestWrapper>
    ),
    props: mergedProps,
  };
};

// Helper to get nav element
const getNav = () => document.querySelector("nav")!;

// Helper to get button by icon class (lucide icon names)
const getButtonByIcon = (iconClass: string, container?: Element) => {
  const root = container || document;
  return root.querySelector(`svg.lucide-${iconClass}`)?.closest("button");
};

// Helper to open "More" menu
const openMoreMenu = async () => {
  // MoreHorizontal icon renders as lucide-ellipsis
  const moreButton = getButtonByIcon("ellipsis", getNav());
  expect(moreButton).toBeDefined();
  fireEvent.click(moreButton!);
  await waitFor(() => {
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
};

// Helper to count menu items in sheet
const countMenuItemsInSheet = () => {
  const dialog = screen.getByRole("dialog");
  // Menu items are buttons inside the sheet with specific structure
  const menuButtons = within(dialog).getAllByRole("button").filter((btn) => {
    // Exclude close button (X) and logout button
    const hasLogoutIcon = btn.querySelector("svg.lucide-log-out");
    const hasCloseIcon = btn.querySelector("svg.lucide-x");
    return !hasLogoutIcon && !hasCloseIcon;
  });
  return menuButtons.length;
};

describe("MobileBottomNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setViewport("mobile");
  });

  afterEach(() => {
    cleanup();
    resetViewport();
  });

  // ========================================
  // GRUPA A: Podstawowe renderowanie (NAV-U-001 do NAV-U-010)
  // ========================================
  describe("Grupa A: Podstawowe renderowanie", () => {
    it("NAV-U-001: Renderuje 5 głównych przycisków nawigacji", () => {
      renderNav();
      
      const nav = getNav();
      expect(nav).toBeInTheDocument();
      
      // Should have 5 interactive elements in bottom nav
      const buttons = nav.querySelectorAll("button");
      expect(buttons.length).toBe(5);
    });

    it("NAV-U-002: Przycisk centralny (Plus) wywołuje onAddReservation", () => {
      const { props } = renderNav();
      
      // Find the Plus button by icon
      const centralButton = getButtonByIcon("plus", getNav());
      
      expect(centralButton).toBeDefined();
      fireEvent.click(centralButton!);
      expect(props.onAddReservation).toHaveBeenCalledTimes(1);
    });

    it("NAV-U-003: Kliknięcie Kalendarz wywołuje onViewChange('calendar')", () => {
      const { props } = renderNav({ currentView: "reservations" });
      
      const calendarButton = getButtonByIcon("calendar", getNav());
      expect(calendarButton).toBeDefined();
      fireEvent.click(calendarButton!);
      expect(props.onViewChange).toHaveBeenCalledWith("calendar");
    });

    it("NAV-U-004: Kliknięcie Rezerwacje wywołuje onViewChange('reservations')", () => {
      const { props } = renderNav();
      
      const listButton = getButtonByIcon("list", getNav());
      expect(listButton).toBeDefined();
      fireEvent.click(listButton!);
      expect(props.onViewChange).toHaveBeenCalledWith("reservations");
    });

    it("NAV-U-006: Badge powiadomień wyświetla się gdy unreadNotificationsCount > 0", () => {
      renderNav({ unreadNotificationsCount: 5 });
      
      const nav = getNav();
      const badges = nav.querySelectorAll(".bg-destructive.rounded-full");
      expect(badges.length).toBeGreaterThan(0);
    });

    it("NAV-U-007: Badge powiadomień jest ukryty gdy unreadNotificationsCount === 0", () => {
      renderNav({ unreadNotificationsCount: 0 });
      
      const nav = getNav();
      const badges = nav.querySelectorAll(".bg-destructive.rounded-full");
      expect(badges.length).toBe(0);
    });

    it("NAV-U-008: Aktywny widok ma klasę text-primary", () => {
      renderNav({ currentView: "calendar" });
      
      const calendarButton = getButtonByIcon("calendar", getNav());
      expect(calendarButton).toHaveClass("text-primary");
    });

    it("NAV-U-009: Nieaktywny widok ma klasę text-muted-foreground", () => {
      renderNav({ currentView: "calendar" });
      
      const listButton = getButtonByIcon("list", getNav());
      expect(listButton).toHaveClass("text-muted-foreground");
    });

    it("NAV-U-010: Wyświetla wersję aplikacji w menu Więcej", async () => {
      renderNav({ currentVersion: "2.5.0" });
      
      await openMoreMenu();
      
      expect(screen.getByText(/v2\.5\.0/)).toBeInTheDocument();
    });
  });

  // ========================================
  // GRUPA B: Sheet "Więcej" (NAV-U-011 do NAV-U-020)
  // ========================================
  describe("Grupa B: Sheet Więcej - podstawowa funkcjonalność", () => {
    it("NAV-U-011: Kliknięcie Więcej otwiera Sheet", async () => {
      renderNav();
      
      const moreButton = getButtonByIcon("ellipsis", getNav());
      fireEvent.click(moreButton!);
      
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("NAV-U-012: Sheet zawiera przycisk zamknięcia (X)", async () => {
      renderNav();
      await openMoreMenu();
      
      const dialog = screen.getByRole("dialog");
      const closeButton = getButtonByIcon("x", dialog);
      expect(closeButton).toBeInTheDocument();
    });

    it("NAV-U-013: Kliknięcie X zamyka Sheet", async () => {
      renderNav();
      await openMoreMenu();
      
      const dialog = screen.getByRole("dialog");
      const closeButton = getButtonByIcon("x", dialog);
      fireEvent.click(closeButton!);
      
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("NAV-U-014: Sheet zawiera przycisk wylogowania", async () => {
      renderNav();
      await openMoreMenu();
      
      const dialog = screen.getByRole("dialog");
      const logoutButton = getButtonByIcon("log-out", dialog);
      expect(logoutButton).toBeInTheDocument();
    });

    it("NAV-U-015: Przycisk wylogowania wywołuje onLogout", async () => {
      const { props } = renderNav();
      await openMoreMenu();
      
      const dialog = screen.getByRole("dialog");
      const logoutButton = getButtonByIcon("log-out", dialog);
      fireEvent.click(logoutButton!);
      
      expect(props.onLogout).toHaveBeenCalledTimes(1);
    });

    it("NAV-U-016: Kliknięcie pozycji menu wywołuje onViewChange z odpowiednim typem", async () => {
      const { props } = renderNav();
      await openMoreMenu();
      
      // Click on "Klienci" menu item
      const customersButton = screen.getByText(/Klienci/i).closest("button");
      fireEvent.click(customersButton!);
      
      // Wait for the setTimeout in handleMoreMenuItemClick (150ms delay)
      await waitFor(() => {
        expect(props.onViewChange).toHaveBeenCalledWith("customers");
      }, { timeout: 500 });
    });

    it("NAV-U-017: Kliknięcie pozycji menu zamyka Sheet", async () => {
      renderNav();
      await openMoreMenu();
      
      const customersButton = screen.getByText(/Klienci/i).closest("button");
      fireEvent.click(customersButton!);
      
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("NAV-U-019: Aktywna pozycja menu ma wyróżnione tło (bg-muted)", async () => {
      renderNav({ currentView: "customers" });
      await openMoreMenu();
      
      const customersButton = screen.getByText(/Klienci/i).closest("button");
      expect(customersButton).toHaveClass("bg-muted");
    });

  });

  // ========================================
  // GRUPA C: Feature flags - widoczność menu items (NAV-U-021 do NAV-U-030)
  // ========================================
  describe("Grupa C: Feature flags - widoczność menu items", () => {
    it("NAV-U-021: Oferty widoczne gdy offersEnabled=true", async () => {
      renderNav({ offersEnabled: true });
      await openMoreMenu();
      
      expect(screen.getByText(/Oferty/i)).toBeInTheDocument();
    });

    it("NAV-U-022: Oferty ukryte gdy offersEnabled=false", async () => {
      renderNav({ offersEnabled: false });
      await openMoreMenu();
      
      expect(screen.queryByText(/Oferty/i)).not.toBeInTheDocument();
    });

    it("NAV-U-023: Kalendarze visible when hallViewEnabled=true and userRole=admin", async () => {
      renderNav({ hallViewEnabled: true, userRole: "admin" });
      await openMoreMenu();

      expect(screen.getByText(/Kalendarze/i)).toBeInTheDocument();
    });

    it("NAV-U-024: Kalendarze hidden when hallViewEnabled=false", async () => {
      renderNav({ hallViewEnabled: false, userRole: "admin" });
      await openMoreMenu();

      expect(screen.queryByText(/Kalendarze/i)).not.toBeInTheDocument();
    });

    it("NAV-U-026: Protokoły widoczne gdy protocolsEnabled=true i userRole=admin", async () => {
      renderNav({ protocolsEnabled: true, userRole: "admin" });
      await openMoreMenu();
      
      expect(screen.getByText("Protokoły")).toBeInTheDocument();
    });

    it("NAV-U-027: Protokoły ukryte gdy protocolsEnabled=false", async () => {
      renderNav({ protocolsEnabled: false, userRole: "admin" });
      await openMoreMenu();
      
      expect(screen.queryByText("Protokoły")).not.toBeInTheDocument();
    });

    it("NAV-U-029: Ustawienia widoczne dla userRole=admin", async () => {
      renderNav({ userRole: "admin" });
      await openMoreMenu();
      
      expect(screen.getByText(/Ustawienia/i)).toBeInTheDocument();
    });

    it("NAV-U-030: Ustawienia ukryte dla userRole=employee", async () => {
      renderNav({ userRole: "employee" });
      await openMoreMenu();
      
      expect(screen.queryByText(/Ustawienia/i)).not.toBeInTheDocument();
    });
  });

  // ========================================
  // GRUPA E: Responsywność (NAV-U-041 do NAV-U-045)
  // ========================================
  describe("Grupa E: Responsywność", () => {
    it("NAV-U-041: Na mobile (375px) - MobileBottomNav jest widoczny", () => {
      setViewport("mobile");
      renderNav();
      
      const nav = getNav();
      expect(nav).toBeInTheDocument();
      // Nav has lg:hidden class
      expect(nav).toHaveClass("lg:hidden");
    });

    it("NAV-U-042: Nav ma klasę lg:hidden (ukryty na desktop)", () => {
      renderNav();
      
      const nav = getNav();
      expect(nav).toHaveClass("lg:hidden");
    });

    it("NAV-U-043: Sheet ma pełną szerokość na mobile (w-full)", async () => {
      setViewport("mobile");
      renderNav();
      await openMoreMenu();
      
      // SheetContent uses role="dialog" 
      const sheetContent = screen.getByRole("dialog");
      expect(sheetContent).toHaveClass("w-full");
    });

    it("NAV-U-044: Przyciski nawigacji mają odpowiedni rozmiar dotyku (h-12 w-12)", () => {
      renderNav();
      
      const nav = getNav();
      const buttons = nav.querySelectorAll("button.h-12.w-12");
      // Should have 4 regular buttons (Calendar, List, Bell, More) - Plus is different size
      expect(buttons.length).toBe(4);
    });

    it("NAV-U-045: Centralny przycisk Plus jest wyróżniony wizualnie (h-14 w-14 rounded-full)", () => {
      renderNav();
      
      const plusButton = document.querySelector("button.h-14.w-14.rounded-full");
      expect(plusButton).toBeInTheDocument();
      expect(plusButton).toHaveClass("bg-primary");
    });
  });

  // ========================================
  // DODATKOWE TESTY: Edge cases
  // ========================================
  describe("Edge cases", () => {
    it("Obsługuje userRole=null jako admin", async () => {
      renderNav({ userRole: null, offersEnabled: true });
      await openMoreMenu();
      
      // Should show admin-only items when role is null (default behavior)
      expect(screen.getByText(/Ustawienia/i)).toBeInTheDocument();
    });

    it("Obsługuje brak currentVersion gracefully", async () => {
      renderNav({ currentVersion: undefined });
      await openMoreMenu();
      
      // Should still show "Panel Admina" without version
      expect(screen.getByText(/Panel Admina/)).toBeInTheDocument();
    });

    it("Wielokrotne otwieranie/zamykanie Sheet działa poprawnie", async () => {
      renderNav();
      
      // Open
      await openMoreMenu();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      
      // Close
      const closeButton = getButtonByIcon("x", screen.getByRole("dialog"));
      fireEvent.click(closeButton!);
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
      
      // Open again
      await openMoreMenu();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("Badge w More button pojawia się gdy są nieprzeczytane powiadomienia", () => {
      renderNav({ unreadNotificationsCount: 1 });
      
      const moreButton = getButtonByIcon("ellipsis", getNav());
      const badge = moreButton?.querySelector(".bg-destructive.rounded-full");
      expect(badge).toBeInTheDocument();
    });

    it("More button jest aktywny gdy currentView jest w menu więcej", () => {
      renderNav({ currentView: "settings" });
      
      const moreButton = getButtonByIcon("ellipsis", getNav());
      expect(moreButton).toHaveClass("text-primary");
    });
  });
});
