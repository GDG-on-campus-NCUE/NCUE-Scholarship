'use client'

import { forwardRef } from 'react'

const ButtonGroup = forwardRef(({
  children,
  className = '',
  orientation = 'horizontal',
  size = 'default',
  variant = 'primary',
  connected = true,
  ...props
}, ref) => {
  const baseClasses = `
    inline-flex
    ${orientation === 'vertical' ? 'flex-col' : 'flex-row'}
    ${connected ? '' : 'gap-2'}
  `

  const connectedClasses = connected ? `
    [&>*:not(:first-child):not(:last-child)]:rounded-none
    [&>*:first-child]:${orientation === 'horizontal' ? 'rounded-r-none' : 'rounded-b-none'}
    [&>*:last-child]:${orientation === 'horizontal' ? 'rounded-l-none' : 'rounded-t-none'}
    [&>*:not(:first-child)]:${orientation === 'horizontal' ? '-ml-px' : '-mt-px'}
  ` : ''

  const classes = `${baseClasses} ${connectedClasses} ${className}`.trim()

  return (
    <div
      ref={ref}
      className={classes}
      role="group"
      {...props}
    >
      {children}
    </div>
  )
})

ButtonGroup.displayName = 'ButtonGroup'

export default ButtonGroup
