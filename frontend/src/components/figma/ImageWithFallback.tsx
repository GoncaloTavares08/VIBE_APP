import React, { useState } from 'react'

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props

  const getInitials = (name?: string) => {
    if (!name) return '?'
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // If there's no src or the image failed to load, show initials fallback
  if (!src || didError) {
    return (
      <div
        className={`inline-flex items-center justify-center font-bold text-white bg-gradient-to-br from-gray-700 to-gray-900 ${className ?? ''}`}
        style={style}
      >
        {getInitials(alt)}
      </div>
    )
  }

  return (
    <img src={src} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}
