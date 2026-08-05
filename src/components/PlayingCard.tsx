import type { ReactNode } from 'react'

type PlayingCardProps = {
  eyebrow?: string
  title?: string
  children?: ReactNode
  variant?: 'light' | 'accent'
  corner?: string
}

export function PlayingCard({
  eyebrow,
  title,
  children,
  variant = 'light',
  corner = '♠',
}: PlayingCardProps) {
  return (
    <article className={`playing-card ${variant === 'accent' ? 'playing-card--accent' : ''}`}>
      <span className="playing-card__corner playing-card__corner--tl" aria-hidden>
        {corner}
      </span>
      <span className="playing-card__corner playing-card__corner--br" aria-hidden>
        {corner}
      </span>
      {eyebrow ? <div className="playing-card__eyebrow">{eyebrow}</div> : null}
      {title ? <h2 className="playing-card__title">{title}</h2> : null}
      {children ? <div className="playing-card__body">{children}</div> : null}
    </article>
  )
}
