"use client";

import { useEffect, useMemo, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/shared/atoms/Button";
import { AuthInputField } from "@/src/components/shared/molecules/AuthInputField";
import { GoogleAuthButton } from "@/src/components/shared/molecules/GoogleAuthButton";
import { Toast } from "@/src/components/shared/molecules/Toast";
import { AuthLayout } from "@/src/components/shared/organisms/AuthLayout";
import {
  getCurrentUser,
  loginWithEmailPassword,
  logoutCurrentSession,
  startGoogleOAuthLogin,
} from "@/src/lib/appwrite/auth";
import { sanitizeNextPath } from "@/src/lib/auth/redirect";

type LoginTemplateProps = {
  initialNext?: string | null;
  initialToast?: string | null;
};

type FieldErrors = {
  email?: string;
  password?: string;
  general?: string;
};

type ToastState = {
  open: boolean;
  message: string;
  type: "error" | "success" | "warning" | "info";
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toastMessagesByCode: Record<string, string> = {
  oauth_error: "No se pudo completar el inicio con Google. Intenta nuevamente.",
  email_not_verified:
    "Debes entrar a la aplicacion movil y terminar el registro o la verificacion de correo para poder iniciar sesión en la web.",
};

export function LoginTemplate({
  initialNext,
  initialToast,
}: LoginTemplateProps) {
  const router = useRouter();

  const nextPath = useMemo(() => sanitizeNextPath(initialNext), [initialNext]);
  const [dismissedQueryToast, setDismissedQueryToast] = useState(false);
  const queryToastMessage =
    !dismissedQueryToast && initialToast && toastMessagesByCode[initialToast]
      ? toastMessagesByCode[initialToast]
      : "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    type: "info",
  });

  useEffect(() => {
    let isActive = true;

    const resolveExistingSession = async () => {
      const user = await getCurrentUser();
      if (!isActive) {
        return;
      }

      if (!user) {
        return;
      }

      if (!user.emailVerification) {
        await logoutCurrentSession();
        if (isActive) {
          setToast({
            open: true,
            message:
              "Debes entrar a la aplicacion movil y terminar el registro o la verificacion de correo para poder iniciar sesión en la web.",
            type: "error",
          });
        }
        return;
      }

      router.replace(nextPath);
    };

    void resolveExistingSession();

    return () => {
      isActive = false;
    };
  }, [nextPath, router]);

  const validateFields = () => {
    const errors: FieldErrors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      errors.email = "El correo es obligatorio.";
    } else if (!emailPattern.test(normalizedEmail)) {
      errors.email = "Ingresa un correo valido.";
    }

    if (!password.trim()) {
      errors.password = "La contraseña es obligatoria.";
    }

    return errors;
  };

  const handleEmailPasswordSubmit = async (
    event: SubmitEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (isSubmitting || isGoogleSubmitting) {
      return;
    }

    const errors = validateFields();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    const loginResult = await loginWithEmailPassword(
      email.trim().toLowerCase(),
      password,
    );

    if (!loginResult.success) {
      setFieldErrors({ general: loginResult.message });
      setToast({
        open: true,
        message: loginResult.message,
        type: "error",
      });
      setIsSubmitting(false);
      return;
    }

    const user = await getCurrentUser();

    if (!user) {
      const message = "No pudimos obtener tu sesión. Intenta nuevamente.";
      setFieldErrors({ general: message });
      setToast({ open: true, message, type: "error" });
      setIsSubmitting(false);
      return;
    }

    if (!user.emailVerification) {
      await logoutCurrentSession();
      const message =
        "Debes entrar a la aplicacion movil y terminar el registro o la verificacion de correo para poder iniciar sesión en la web.";
      setFieldErrors({ general: message });
      setToast({ open: true, message, type: "error" });
      setIsSubmitting(false);
      return;
    }

    router.replace(nextPath);
  };

  const handleGoogleLogin = async () => {
    if (isSubmitting || isGoogleSubmitting) {
      return;
    }

    setFieldErrors({});
    setIsGoogleSubmitting(true);

    try {
      await startGoogleOAuthLogin(nextPath);
    } catch {
      setToast({
        open: true,
        message: "No se pudo iniciar con Google. Intenta nuevamente.",
        type: "error",
      });
      setIsGoogleSubmitting(false);
    }
  };

  const handleToastClose = () => {
    if (queryToastMessage) {
      setDismissedQueryToast(true);
      const targetUrl =
        nextPath !== "/"
          ? `/login?next=${encodeURIComponent(nextPath)}`
          : "/login";
      router.replace(targetUrl);
      return;
    }

    setToast((previous) => ({ ...previous, open: false }));
  };

  return (
    <>
      <AuthLayout
        title="Iniciar sesión"
        subtitle="Accede para continuar con tu progreso nutricional."
      >
        <form className="space-y-5" onSubmit={handleEmailPasswordSubmit}>
          <div className="space-y-4">
            <AuthInputField
              label="Correo"
              type="email"
              name="email"
              placeholder="nombre@correo.com"
              autoComplete="email"
              value={email}
              onChange={setEmail}
              disabled={isSubmitting || isGoogleSubmitting}
              error={fieldErrors.email}
            />
            <AuthInputField
              label="Contraseña"
              type="password"
              name="password"
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              disabled={isSubmitting || isGoogleSubmitting}
              error={fieldErrors.password}
            />
          </div>

          <Button
            label="Entrar"
            isLoading={isSubmitting}
            showLoadingLabel={false}
            className="h-12 w-full rounded-xl text-base hover:bg-(--color-accent-link)"
            type="submit"
            disabled={isGoogleSubmitting}
          />

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-(--color-border)" />
            <span className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
              o continuar con
            </span>
            <span className="h-px flex-1 bg-(--color-border)" />
          </div>

          <GoogleAuthButton
            label="Continuar con Google"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            isLoading={isGoogleSubmitting}
          />

          <p className="text-center text-sm text-(--color-muted)">
            El registro de cuentas se realiza desde la app movil.
          </p>
        </form>
      </AuthLayout>

      <Toast
        open={toast.open || Boolean(queryToastMessage)}
        message={toast.open ? toast.message : queryToastMessage}
        type={toast.open ? toast.type : "error"}
        onClose={handleToastClose}
      />
    </>
  );
}
