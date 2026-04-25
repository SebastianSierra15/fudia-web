"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "../atoms/Button";
import { Container } from "../atoms/Container";

type NavItemKey = "producto" | "como-funciona" | "precios" | "blog";

type NavBarProps = {
  activeItem?: NavItemKey;
};

const navItems: { key: NavItemKey; label: string; href: string }[] = [
  { key: "producto", label: "Producto", href: "/producto" },
  { key: "como-funciona", label: "Cómo funciona", href: "/como-funciona" },
  { key: "precios", label: "Precios", href: "/precios" },
  { key: "blog", label: "Blog", href: "#blog" },
];

export function NavBar({ activeItem }: NavBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <header className="relative z-40 border-b border-(--color-nav-border) bg-background py-3">
        <Container>
          <nav className="flex items-center justify-between gap-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:justify-items-center">
            <Link
              href="/"
              title="Fudia"
              className="flex items-center gap-2 lg:justify-self-start"
              onClick={closeMobileMenu}
            >
              <div className="flex h-12 w-12 items-center justify-center">
                <Image
                  src="/global/fudia_logo.png"
                  alt="Fudia"
                  title="Fudia"
                  width={32}
                  height={32}
                  className="h-12 w-12 object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xl font-semibold text-foreground">
                  Fudia
                </span>
              </div>
            </Link>

            <div className="hidden items-center gap-6 text-(--color-muted) lg:flex lg:justify-self-center">
              {navItems.map((item) => {
                const isActive = item.key === activeItem;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    title={item.label}
                    className={`transition-colors hover:text-foreground ${
                      isActive ? "font-semibold text-(--color-accent)" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3 lg:justify-self-end">
              <button
                type="button"
                title="Abrir menú"
                aria-label="Abrir menú"
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-(--color-nav-border) bg-(--color-surface-2) text-foreground transition-colors hover:bg-(--color-surface) lg:hidden"
              >
                <Menu size={22} strokeWidth={2.2} />
              </button>

              <div className="hidden items-center gap-3 lg:flex">
                <Button
                  label="Iniciar sesión"
                  href="/login"
                  variant="ghost"
                  className="border border-(--color-nav-border) bg-(--color-surface-2)"
                />
                <Button
                  label="Descargar gratis"
                  href="/"
                  className="hover:bg-(--color-accent-link) hover:text-(--color-accent-contrast)"
                />
              </div>
            </div>
          </nav>
        </Container>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-black/45 transition-opacity duration-200 lg:hidden ${
          isMobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={closeMobileMenu}
        aria-hidden={!isMobileMenuOpen}
      />

      <aside
        className={`fixed top-0 right-0 z-50 h-dvh w-80 max-w-[88vw] border-l border-(--color-nav-border) bg-background p-6 shadow-[0_18px_45px_rgba(0,0,0,0.25)] transition-transform duration-200 ease-out lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="mb-8 flex items-center justify-between">
          <span className="text-2xl font-semibold text-foreground">Menú</span>
          <button
            type="button"
            title="Cerrar menú"
            aria-label="Cerrar menú"
            onClick={closeMobileMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-(--color-nav-border) bg-(--color-surface-2) text-foreground transition-colors hover:bg-(--color-surface)"
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = item.key === activeItem;
            return (
              <Link
                key={item.key}
                href={item.href}
                title={item.label}
                onClick={closeMobileMenu}
                className={`rounded-xl px-4 py-3 text-base font-medium transition-colors hover:bg-(--color-surface-2) hover:text-foreground ${
                  isActive
                    ? "bg-(--color-surface-2) text-(--color-accent)"
                    : "text-(--color-muted)"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-7 space-y-3 border-t border-(--color-nav-border) pt-6">
          <Button
            label="Iniciar sesión"
            href="/login"
            onClick={closeMobileMenu}
            variant="ghost"
            className="w-full border border-(--color-nav-border) bg-(--color-surface-2)"
          />
          <Button
            label="Descargar gratis"
            href="/"
            onClick={closeMobileMenu}
            className="w-full hover:bg-(--color-accent-link) hover:text-(--color-accent-contrast)"
          />
        </div>
      </aside>
    </>
  );
}
