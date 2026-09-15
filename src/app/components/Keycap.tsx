import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'

export type KeycapVariant = 'primary' | 'secondary' | 'coral' | 'sun' | 'lav' | 'mint' | 'ghost' | 'plain'
export type KeycapSize = 'sm' | 'md' | 'lg'

const variantClass: Record<KeycapVariant, string> = {
  primary: 'keycap-primary',
  secondary: 'keycap-secondary',
  coral: 'keycap-coral',
  sun: 'keycap-sun',
  lav: 'keycap-lav',
  mint: 'keycap-mint',
  ghost: 'keycap-ghost',
  plain: '',
}

const sizeClass: Record<KeycapSize, string> = { sm: 'keycap-sm', md: '', lg: 'keycap-lg' }

interface BaseProps {
  variant?: KeycapVariant
  size?: KeycapSize
  className?: string
  children: ReactNode
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined }
type LinkProps = BaseProps & { to: string; disabled?: boolean }

export function Keycap(props: ButtonProps | LinkProps) {
  const { variant = 'plain', size = 'md', className = '', children } = props
  const cls = `keycap ${variantClass[variant]} ${sizeClass[size]} ${className}`.trim()
  if ('to' in props && props.to !== undefined) {
    if (props.disabled) return <span className={`${cls} opacity-55 cursor-not-allowed`}>{children}</span>
    return (
      <Link to={props.to} className={cls}>
        {children}
      </Link>
    )
  }
  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props as ButtonProps
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  )
}
