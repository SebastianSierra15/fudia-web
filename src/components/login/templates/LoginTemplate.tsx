import { Button } from "@/src/components/shared/atoms/Button";
import { AuthInputField } from "@/src/components/shared/molecules/AuthInputField";
import { GoogleAuthButton } from "@/src/components/shared/molecules/GoogleAuthButton";
import { AuthLayout } from "@/src/components/shared/organisms/AuthLayout";

export function LoginTemplate() {
  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Accede para continuar con tu progreso nutricional."
    >
      <div className="space-y-5">
        <div className="space-y-4">
          <AuthInputField
            label="Correo"
            type="email"
            placeholder="nombre@correo.com"
            autoComplete="email"
          />
          <AuthInputField
            label="Contraseña"
            type="password"
            placeholder="Ingresa tu contraseña"
            autoComplete="current-password"
          />
        </div>

        <Button
          label="Entrar"
          className="h-12 w-full rounded-xl text-base hover:bg-(--color-accent-link)"
        />

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-(--color-border)" />
          <span className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
            o continuar con
          </span>
          <span className="h-px flex-1 bg-(--color-border)" />
        </div>

        <GoogleAuthButton label="Continuar con Google" />

        <p className="text-center text-sm text-(--color-muted)">
          El registro de cuentas se realiza desde la app móvil.
        </p>
      </div>
    </AuthLayout>
  );
}
