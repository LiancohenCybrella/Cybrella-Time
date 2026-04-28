import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", loading, children, className = "", disabled, ...rest },
  ref
) {
  const cls =
    variant === "primary"
      ? "btn-primary"
      : variant === "danger"
      ? "btn-danger"
      : "btn-ghost";

  return (
    <button
      ref={ref}
      className={`${cls} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="opacity-60">Working…</span> : children}
    </button>
  );
});
