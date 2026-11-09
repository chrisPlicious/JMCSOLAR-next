import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from "react"
import { AlertCircle, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * One field style for the whole site (public forms, booking, calculator,
 * admin): white fill, slate-300 border, 44px tall, 16px text (no iOS zoom),
 * navy focus ring. Errors show an icon + text, never colour alone.
 */
export const controlClasses =
  "w-full min-h-11 rounded-control border border-input bg-white px-4 text-base text-navy-950 placeholder:text-slate-500 transition-[border-color,box-shadow] duration-150 hover:border-slate-400 focus:border-navy-500 focus:ring-4 focus:ring-navy-500/15 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 aria-invalid:border-red-600 aria-invalid:focus:ring-red-600/15"

export function Input({ className, ...props }: ComponentPropsWithRef<"input">) {
  return <input className={cn(controlClasses, "py-2.5", className)} {...props} />
}

export function Textarea({ className, rows = 4, ...props }: ComponentPropsWithRef<"textarea">) {
  return <textarea rows={rows} className={cn(controlClasses, "py-3 leading-relaxed", className)} {...props} />
}

export function Select({
  className,
  wrapperClassName,
  children,
  ...props
}: ComponentPropsWithRef<"select"> & { wrapperClassName?: string }) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select className={cn(controlClasses, "cursor-pointer appearance-none py-2.5 pr-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-slate-500"
        aria-hidden
      />
    </div>
  )
}

export function Label({
  className,
  children,
  required,
  ...props
}: ComponentPropsWithRef<"label"> & { required?: boolean }) {
  return (
    <label className={cn("mb-1.5 block text-sm font-semibold text-fg", className)} {...props}>
      {children}
      {required && (
        <span className="ml-0.5 text-red-600" aria-hidden>
          *
        </span>
      )}
    </label>
  )
}

export function FieldHint({ className, ...props }: ComponentPropsWithRef<"p">) {
  return <p className={cn("mt-1.5 text-sm text-fg-subtle", className)} {...props} />
}

export function FieldError({ className, children, ...props }: ComponentPropsWithRef<"p">) {
  if (!children) return null
  return (
    <p className={cn("mt-1.5 flex items-start gap-1.5 text-sm font-medium text-red-600", className)} {...props}>
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}

interface FieldProps {
  /** id of the control; used for the label and the hint/error ids. */
  id: string
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  className?: string
  /** A single Input / Select / Textarea (or any element accepting id + aria props). */
  children: ReactElement
}

/**
 * Label + control + hint/error, with the accessibility wiring done for you:
 * the child receives `id`, `aria-invalid` and `aria-describedby`.
 */
export function Field({ id, label, hint, error, required, className, children }: FieldProps) {
  const hintId = hint && !error ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined
  const child = Children.only(children)
  const control = isValidElement<Record<string, unknown>>(child)
    ? cloneElement(child, {
        id,
        required: (child.props.required as boolean | undefined) ?? required,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })
    : child

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      {control}
      {hint && !error && <FieldHint id={hintId}>{hint}</FieldHint>}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  )
}

export default Field
