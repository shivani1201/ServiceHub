import './Loader.css';

const Loader = ({ label = 'Loading...', fullPage = false, variant = 'spinner', count = 6 }) => {
  if (variant === 'cards') {
    return (
      <div className="skeleton-grid" aria-busy="true" aria-label={label}>
        {Array.from({ length: count }).map((_, index) => (
          <div className="skeleton-card" key={index}>
            <div className="skeleton skeleton--media" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line skeleton--short" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={`loader ${fullPage ? 'loader--full' : ''}`} role="status">
      <span className="loader__ring" />
      <span className="loader__label">{label}</span>
    </div>
  );
};

export default Loader;
