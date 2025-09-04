'use client'

import { forwardRef } from 'react'

const Button = forwardRef(({
  children,
  className = '',
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  const baseClasses = `
    inline-flex items-center justify-center gap-2 
    font-medium rounded-lg transition-all duration-300 
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed
    transform hover:scale-[1.02] active:scale-[0.98]
    shadow-sm hover:shadow-md
  `

  const variantClasses = {
    primary: `
      bg-blue-600 text-white border border-blue-600
      hover:bg-blue-700 hover:border-blue-700
      focus:ring-blue-500/30
      shadow-blue-500/30
      font-bold
    `,
    secondary: `
      bg-white text-primary border border-primary
      hover:bg-primary/5 hover:border-primary-600
      focus:ring-primary/20
      font-bold
    `,
    success: `
      bg-success text-white border border-success
      hover:bg-green-600 hover:border-green-600
      focus:ring-success/20
      shadow-success/20
      font-bold
    `,
    danger: `
      bg-red-700 text-white border border-error
      hover:bg-red-600 hover:border-red-600
      focus:ring-error/20
      shadow-error/20
      font-bold
    `,
    warning: `
      bg-accent text-gray-800 border border-accent
      hover:bg-yellow-500 hover:border-yellow-500
      focus:ring-accent/20
      shadow-accent/20
    `,
    ghost: `
      bg-transparent text-gray-700 border border-transparent
      hover:bg-gray-100 hover:text-gray-900
      focus:ring-gray-500/20
    `,
    link: `
      bg-transparent text-primary border border-transparent p-0
      hover:text-primary-600 hover:underline
      focus:ring-primary/20 shadow-none hover:shadow-none
      hover:scale-100 active:scale-100
    `
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    default: 'px-4 py-2 text-sm min-h-[40px]',
    lg: 'px-6 py-3 text-base min-h-[48px]',
    xl: 'px-8 py-4 text-lg min-h-[56px]'
  }

  const classes = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size] || sizeClasses.default}
    ${disabled ? 'hover:scale-100 active:scale-100' : ''}
    ${className}
  `.trim()

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m100 50c0 27.614-22.386 50-50 50s-50-22.386-50-50 22.386-50 50-50 50 22.386 50 50zm-90.196 0c0 22.091 17.909 40 40 40s40-17.909 40-40-17.909-40-40-40-40 17.909-40 40z"
          />
        </svg>
      )}
      {leftIcon && !loading && <span className="text-lg">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="text-lg">{rightIcon}</span>}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
