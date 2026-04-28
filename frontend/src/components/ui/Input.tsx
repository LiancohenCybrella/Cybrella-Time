import { InputHTMLAttributes, forwardRef } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, className = "", id, ...rest },
  ref
) {
  const inputId = id ?? rest.name ?? Math.random().toString(36).slice(2);
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <input id={inputId} ref={ref} className={`input ${className}`} {...rest} />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
});
