import Button from '../../components/Button/Button.jsx';
import './NotFound.css';

const NotFound = () => (
  <section className="notfound">
    <div className="container notfound__inner">
      <p className="notfound__code" aria-hidden="true">404</p>
      <h1>We could not find that page</h1>
      <p className="muted">The link may be broken, or the page may have moved. Try the services list instead.</p>
      <div className="notfound__actions">
        <Button to="/services">Browse services</Button>
        <Button to="/" variant="outline">Go to the home page</Button>
      </div>
    </div>
  </section>
);

export default NotFound;
