import clsx from "clsx";
import { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: Props) {
  return (
    <div
      className={clsx(
        "bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-slate-100",
        className
      )}
      {...props}
    />
  );
}