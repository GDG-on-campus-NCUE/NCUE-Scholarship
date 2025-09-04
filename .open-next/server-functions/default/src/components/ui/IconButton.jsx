'use client'

import { forwardRef } from 'react'

const IconButton = forwardRef(({
  children,
  className = '',
  variant = 'ghost',
  size = 'default',
  disabled = false,
  loading = false,
  tooltip,
  ...props
}, ref) => {
  const baseClasses = `
    inline-flex items-center justify-center 
    font-medium rounded-lg transition-all duration-300 
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed
    transform hover:scale-110 active:scale-95
    shadow-sm hover:shadow-md
  `

  const variantClasses = {
    primary: `
      bg-primary text-white border border-primary
      hover:bg-primary-600 hover:border-primary-600
      focus:ring-primary/20
    `,
    secondary: `
      bg-white text-primary border border-primary
      hover:bg-primary/5 hover:border-primary-600
      focus:ring-primary/20
    `,
    success: `
      bg-success text-white border border-success
      hover:bg-green-600 hover:border-green-600
      focus:ring-success/20
    `,
    danger: `
      bg-error text-white border border-error
      hover:bg-red-600 hover:border-red-600
      focus:ring-error/20
    `,
    warning: `
      bg-accent text-gray-800 border border-accent
      hover:bg-yellow-500 hover:border-yellow-500
      focus:ring-accent/20
    `,
    ghost: `
      bg-transparent text-gray-600 border border-transparent
      hover:bg-gray-100 hover:text-gray-900
      focus:ring-gray-500/20
    `,
    outline: `
      bg-transparent text-gray-700 border border-gray-300
      hover:bg-gray-50 hover:border-gray-400
      focus:ring-gray-500/20
    `
  }

  const sizeClasses = {
    sm: 'p-1.5 text-sm w-8 h-8',
    default: 'p-2 text-base w-10 h-10',
    lg: 'p-3 text-lg w-12 h-12',
    xl: 'p-4 text-xl w-14 h-14'
  }

  const classes = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.ghost}
    ${sizeClasses[size] || sizeClasses.default}
    ${disabled ? 'hover:scale-100 active:scale-100' : ''}
    ${className}
  `.trim()

  const button = (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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
      ) : (
        children
      )}
    </button>
  )

  if (tooltip) {
    return (
      <div className="relative group">
        {button}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    )
  }

  return button
})

IconButton.displayName = 'IconButton'

export default IconButton
