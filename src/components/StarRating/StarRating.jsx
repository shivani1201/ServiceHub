import { useState } from 'react';
import { Star } from 'lucide-react';
import './StarRating.css';

const StarRating = ({ value = 0, count, size = 16, showValue = false, interactive = false, onChange }) => {
  const [hovered, setHovered] = useState(0);
  const score = Number(value) || 0;

  if (interactive) {
    const shown = hovered || score;
    return (
      <div className="stars stars--interactive" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} className={`stars__btn ${n <= shown ? 'is-on' : ''}`} onClick={() => onChange(n)} onMouseEnter={() => setHovered(n)} role="radio" aria-checked={n === score} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
            <Star size={size} fill={n <= shown ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    );
  }

  const rounded = Math.round(score);
  return (
    <span className="stars" aria-label={`Rated ${score.toFixed(1)} out of 5`}>
      <span className="stars__row">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={size} fill={n <= rounded ? 'currentColor' : 'none'} className={n <= rounded ? 'is-on' : ''} />
        ))}
      </span>
      {showValue && <strong className="stars__value">{score.toFixed(1)}</strong>}
      {count !== undefined && <span className="stars__count">({count})</span>}
    </span>
  );
};

export default StarRating;
