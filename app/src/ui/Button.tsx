import type { ButtonHTMLAttributes, ReactNode } from "react"
import { classNames, ControlSize } from "./types"

export enum ButtonVariant {
  Primary = "primary",
  Secondary = "secondary",
  Ghost = "ghost",
  Danger = "danger",
  Link = "link",
}

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?: ButtonVariant
  size?: ControlSize
  icon?: ReactNode
  stretch?: boolean
  // A toggle: shows whether it is on and tells assistive tech (aria-pressed).
  pressed?: boolean
}

export function Button({
  variant = ButtonVariant.Secondary,
  size = ControlSize.Medium,
  icon,
  stretch = false,
  pressed,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  const className = classNames(
    "ui-button",
    `ui-button--${variant}`,
    `ui-button--${size}`,
    stretch ? "ui-button--stretch" : null,
    pressed ? "ui-button--pressed" : null,
  )

  return (
    <button {...rest} type={type} aria-pressed={pressed} className={className}>
      {icon ? (
        <span className="ui-button-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  )
}
