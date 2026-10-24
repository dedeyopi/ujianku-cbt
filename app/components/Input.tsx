import clsx from "clsx";
import { InputHTMLAttributes, forwardRef } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, className, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500",
            "placeholder:text-slate-400 transition",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";