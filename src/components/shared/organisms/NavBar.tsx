"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, LogOut, Menu, User, X } from "lucide-react";
import { Button } from "../atoms/Button";
import { Container } from "../atoms/Container";
import { buildLoginHref } from "@/src/lib/auth/redirect";
import { getCurrentUser, logoutCurrentSession } from "@/src/lib/appwrite/auth";

type NavItemKey = "producto" | "como-funciona" | "precios" | "blog";
type AuthStatus = "checking" | "authenticated" | "guest";

type NavBarProps = {
  activeItem?: NavItemKey;
};

const navItems: { key: NavItemKey; label: string; href: string }[] = [
  { key: "producto", label: "Producto", href: "/producto" },
  { key: "como-funciona", label: "Como funciona", href: "/como-funciona" },
  { key: "precios", label: "Precios", href: "/precios" },
  { key: "blog", label: "Blog", href: "#blog" },
];

const APP_ENTRY_HREF = "/";

export function NavBar({ activeItem }: NavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [userLabel, setUserLabel] = useState("Usuario");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const loginHref = useMemo(() => buildLoginHref(pathname), [pathname]);
  const isAuthenticated = authStatus === "authenticated";

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const resolveSession = async () => {
      const user = await getCurrentUser();

      if (!isActive) {
        return;
      }

      if (!user) {
        setAuthStatus("guest");
        return;
      }

      if (!user.emailVerification) {
        await logoutCurrentSession().catch(() => undefined);

        if (isActive) {
          setAuthStatus("guest");
        }
        return;
      }

      const name = user.name?.trim();
      const email = user.email?.trim();
      setUserLabel(name || email || "Usuario");
      setAuthStatus("authenticated");
    };

    void resolveSession();

    return () => {
      isActive = false;
    };
  }, []);

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

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!userMenuRef.current) {
        return;
      }

      const target = event.target as Node | null;
      if (target && userMenuRef.current.contains(target)) {
        return;
      }

      setIsUserMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setIsUserMenuOpen(false);
    }
  }, [authStatus]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    if (isMountedRef.current) {
      setIsLoggingOut(true);
    }

    try {
      await logoutCurrentSession();
      if (isMountedRef.current) {
        setAuthStatus("guest");
        setUserLabel("Usuario");
        setIsUserMenuOpen(false);
        closeMobileMenu();
        router.refresh();
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoggingOut(false);
      }
    }
  };

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
                title="Abrir menu"
                aria-label="Abrir menu"
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-(--color-nav-border) bg-(--color-surface-2) text-foreground transition-colors hover:bg-(--color-surface) lg:hidden"
              >
                <Menu size={22} strokeWidth={2.2} />
              </button>

              <div className="hidden items-center gap-3 lg:flex">
                {authStatus === "checking" ? (
                  <div className="h-11 w-40 animate-pulse rounded-xl border border-(--color-nav-border) bg-(--color-surface-2)" />
                ) : isAuthenticated ? (
                  <>
                    <Button
                      label="Ir a la app"
                      href={APP_ENTRY_HREF}
                      className="hover:bg-(--color-accent-link) hover:text-(--color-accent-contrast)"
                    />

                    <div ref={userMenuRef} className="relative">
                      <button
                        type="button"
                        title="Cuenta"
                        aria-label="Cuenta"
                        aria-expanded={isUserMenuOpen}
                        onClick={() =>
                          setIsUserMenuOpen((previous) => !previous)
                        }
                        className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-(--color-nav-border) bg-(--color-surface-2) text-foreground transition-colors hover:bg-(--color-surface)"
                      >
                        <User size={20} />
                      </button>

                      <div
                        className={`absolute top-full right-0 z-20 pt-3 transition-all duration-200 ${
                          isUserMenuOpen
                            ? "pointer-events-auto translate-y-0 opacity-100"
                            : "pointer-events-none -translate-y-1 opacity-0"
                        }`}
                      >
                        <div className="w-64 rounded-2xl border border-(--color-nav-border) bg-(--color-surface) p-4 shadow-[0_16px_40px_rgba(0,0,0,0.3)]">
                          <p className="text-xs font-medium tracking-wide text-(--color-muted)">
                            Sesión iniciada
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-foreground">
                            {userLabel}
                          </p>

                          <button
                            type="button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-(--color-nav-border) bg-(--color-surface-2) px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-(--color-surface) disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {isLoggingOut ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <LogOut size={16} />
                            )}
                            Cerrar sesión
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Button
                      label="Iniciar sesión"
                      href={loginHref}
                      variant="ghost"
                      className="border border-(--color-nav-border) bg-(--color-surface-2)"
                    />
                    <Button
                      label="Descargar gratis"
                      href="/"
                      className="hover:bg-(--color-accent-link) hover:text-(--color-accent-contrast)"
                    />
                  </>
                )}
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
          <span className="text-2xl font-semibold text-foreground">Menu</span>
          <button
            type="button"
            title="Cerrar menu"
            aria-label="Cerrar menu"
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
          {authStatus === "checking" ? (
            <div className="h-11 w-full animate-pulse rounded-xl border border-(--color-nav-border) bg-(--color-surface-2)" />
          ) : isAuthenticated ? (
            <>
              <Button
                label="Ir a la app"
                href={APP_ENTRY_HREF}
                onClick={closeMobileMenu}
                className="w-full hover:bg-(--color-accent-link) hover:text-(--color-accent-contrast)"
              />

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-(--color-nav-border) bg-(--color-surface-2) px-4 text-sm font-semibold text-foreground transition-colors hover:bg-(--color-surface) disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoggingOut ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LogOut size={16} />
                )}
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Button
                label="Iniciar sesión"
                href={loginHref}
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
            </>
          )}
        </div>
      </aside>
    </>
  );
}
