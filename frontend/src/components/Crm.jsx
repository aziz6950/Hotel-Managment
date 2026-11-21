export function Stars({ value = 0 }) {
  return (
    <span className="review-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={`bi ${n <= Math.round(value) ? 'bi-star-fill' : 'bi-star'} me-1`}></i>
      ))}
    </span>
  )
}

const TIER_ICON = { Bronze: 'bi-award', Silver: 'bi-award-fill', Gold: 'bi-trophy-fill', Platinum: 'bi-gem' }

export function TierBadge({ tier }) {
  return (
    <span className={`tier-badge tier-${(tier || 'Bronze').toLowerCase()}`}>
      <i className={`bi ${TIER_ICON[tier] || 'bi-award'} me-1`}></i>{tier}
    </span>
  )
}
