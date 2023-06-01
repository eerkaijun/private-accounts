import { ReactNode } from "react";
import classNames from "classnames";
export function Horizontal({
  gap,
  right,
  ...p
}: {
  children: ReactNode;
  gap?: boolean;
  right?: boolean;
  className?: string;
}) {
  return (
    <div
      className={classNames("flex flex-row w-full", p.className, {
        "gap-4": gap,
        "justify-center": !right,
        "justify-end": right,
      })}
      {...p}
    />
  );
}
