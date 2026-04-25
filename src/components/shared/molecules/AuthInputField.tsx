import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type AuthInputFieldProps = {
  label: string;
  type?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  autoComplete?: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  onChange?: (value: string) => void;
};

export function AuthInputField({
  label,
  type = "text",
  id,
  name,
  placeholder,
  autoComplete,
  value,
  required = false,
  disabled = false,
  error,
  onChange,
}: AuthInputFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const isPasswordField = type === "password";
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const resolvedInputType =
    isPasswordField && isPasswordVisible ? "text" : type;

  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={resolvedInputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          onChange={(event) => onChange?.(event.target.value)}
          className={`h-12 w-full rounded-xl border bg-background px-4 text-base text-foreground outline-none transition-colors placeholder:text-(--color-muted) focus:border-(--color-accent) ${
            isPasswordField ? "pr-12" : ""
          } ${
            error
              ? "border-red-500 focus:border-red-500"
              : "border-(--color-border)"
          } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
        />
        {isPasswordField ? (
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-(--color-muted) transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            onClick={() => setIsPasswordVisible((previous) => !previous)}
            disabled={disabled}
            aria-label={
              isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {isPasswordVisible ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>
      {error ? (
        <span id={`${inputId}-error`} className="text-xs text-red-500">
          {error}
        </span>
      ) : null}
    </label>
  );
}
