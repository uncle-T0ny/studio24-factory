import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Link } from "react-router-dom"
import { classNames, ControlSize } from "./types"

export enum IconButtonVariant {
  Ghost = "ghost",
  Danger = "danger",
}

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "children" | "aria-label"
> {
  label: string
  icon: ReactNode
  variant?: IconButtonVariant
  size?: ControlSize.Small | ControlSize.Medium
  // A tool or toggle: shows whether it is on and tells assistive tech (aria-pressed).
  pressed?: boolean
}

function iconButtonClassName(
  variant: IconButtonVariant,
  size: ControlSize,
  pressed?: boolean,
): string {
  return classNames(
    "ui-icon-button",
    `ui-icon-button--${variant}`,
    `ui-icon-button--${size}`,
    pressed ? "ui-icon-button--pressed" : null,
  )
}

export function IconButton({
  label,
  icon,
  variant = IconButtonVariant.Ghost,
  size = ControlSize.Small,
  pressed,
  type = "button",
  title,
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      title={title ?? label}
      className={iconButtonClassName(variant, size, pressed)}
    >
      {icon}
    </button>
  )
}

export interface IconLinkProps {
  to: string
  label: string
  icon: ReactNode
  size?: ControlSize.Small | ControlSize.Medium
}

export function IconLink({ to, label, icon, size = ControlSize.Small }: IconLinkProps) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className={iconButtonClassName(IconButtonVariant.Ghost, size)}
    >
      {icon}
    </Link>
  )
}
