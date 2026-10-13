import './Loader.css';

const Loader = ({ label = 'Loading...', fullPage = false }) => (
  <div className={`loader ${fullPage ? 'loader--full' : ''}`} role="status">
    <span className="loader__ring" />
    <span>{label}</span>
  </div>
);

export default Loader;
