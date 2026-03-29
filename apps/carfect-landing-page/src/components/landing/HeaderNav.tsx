"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

interface HeaderNavProps {
  items: NavItem[];
  isScrolled: boolean;
  onItemClick?: () => void;
  isMobile?: boolean;
}

const HeaderNav = ({ items, isScrolled, onItemClick, isMobile = false }: HeaderNavProps) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  if (isMobile) {
    return (
      <nav className="flex flex-col gap-1 py-4">
        {items.map((item) => (
          <div key={item.label}>
            {item.children ? (
              <>
                <button
                  onClick={() =>
                    setOpenDropdown(openDropdown === item.label ? null : item.label)
                  }
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground/80 hover:text-primary rounded-lg transition-colors"
                >
                  {item.label}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      openDropdown === item.label && "rotate-180"
                    )}
                  />
                </button>
                {openDropdown === item.label && (
                  <div className="ml-4 mt-1 flex flex-col gap-1">
                    <Link
                      href={item.href}
                      onClick={onItemClick}
                      className="px-4 py-2 text-sm font-medium text-primary"
                    >
                      Wszystkie {item.label.toLowerCase()}
                    </Link>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onItemClick}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-primary rounded-lg transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                onClick={onItemClick}
                className="block px-4 py-3 text-sm font-medium text-foreground/80 hover:text-primary rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="hidden md:flex items-center gap-1">
      {items.map((item) => (
        <div
          key={item.label}
          className="relative"
          onMouseEnter={() => item.children && setOpenDropdown(item.label)}
          onMouseLeave={() => setOpenDropdown(null)}
        >
          {/* Always a link — clicking goes to the page, hovering shows dropdown */}
          <Link
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              isScrolled
                ? "text-foreground/80 hover:text-primary"
                : "text-white hover:text-white/80"
            )}
          >
            {item.label}
            {item.children && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  openDropdown === item.label && "rotate-180"
                )}
              />
            )}
          </Link>

          {/* Dropdown on hover */}
          {item.children && openDropdown === item.label && (
            <div className="absolute top-full left-0 pt-1 z-50">
              <div className="min-w-[240px] bg-white rounded-lg py-2" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => {
                      setOpenDropdown(null);
                      onItemClick?.();
                    }}
                    className="block px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </nav>
  );
};

export default HeaderNav;
