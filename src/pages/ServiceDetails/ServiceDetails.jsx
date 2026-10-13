import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapPin, Clock, BadgeCheck, ChevronRight } from 'lucide-react';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Button from '../../components/Button/Button.jsx';
import StarRating from '../../components/StarRating/StarRating.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import EmptyState from '../../components/EmptyState/EmptyState.jsx';
import { serviceAPI, reviewAPI } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDate, formatDuration, formatPrice, getCategoryMeta, getErrorMessage } from '../../utils/helpers.js';
import './ServiceDetails.css';

const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([serviceAPI.getById(id), reviewAPI.getForService(id)])
      .then(([serviceData, reviewData]) => {
        if (!active) return;
        setService(serviceData.service);
        setReviews(reviewData.reviews);
      })
      .catch((err) => active && setError(getErrorMessage(err, 'This service could not be found.')))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [id]);

  const handleBookClick = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/book/${id}` } } });
      return;
    }
    navigate(`/book/${id}`);
  };

  if (loading) return <Loader fullPage label="Loading service" />;

  if (error || !service) {
    return (
      <div className="page">
        <div className="container">
          <EmptyState variant="error" title="Service not found" message={error} actionLabel="Browse services" actionTo="/services" />
        </div>
      </div>
    );
  }

  const provider = service.provider || {};
  const { Icon, bg, fg } = getCategoryMeta(service.category?.name);

  return (
    <div className="page">
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/services">Services</Link>
          <ChevronRight size={14} />
          <Link to={`/services?category=${service.category?._id}`}>{service.category?.name}</Link>
          <ChevronRight size={14} />
          <span aria-current="page">{service.title}</span>
        </nav>

        <div className="sd">
          <div className="sd__main">
            <div className="sd__media" style={service.image ? undefined : { background: bg, color: fg }}>
              {service.image ? <img src={service.image} alt={service.title} /> : <Icon size={64} strokeWidth={1.4} />}
            </div>

            <div className="sd__header">
              <span className="badge badge--violet">{service.category?.name}</span>
              <h1>{service.title}</h1>
              <div className="sd__stats">
                {service.numReviews > 0 ? <StarRating value={service.rating} count={service.numReviews} showValue /> : <span className="muted">No reviews yet</span>}
                <span className="sd__dot" aria-hidden="true" />
                <span className="sd__duration"><Clock size={16} /> {formatDuration(service.duration)}</span>
              </div>
            </div>

            <section className="sd__section">
              <h2>About this service</h2>
              <p>{service.description}</p>
            </section>

            <section className="sd__section">
              <h2>About the provider</h2>
              <Link to={`/providers/${provider._id}`} className="sd__provider">
                <Avatar name={provider.name} src={provider.profileImage} size="lg" />
                <div>
                  <h3>{provider.name} <BadgeCheck size={16} /></h3>
                  <p className="muted"><MapPin size={14} /> {provider.location} &middot; {provider.experience} years experience</p>
                  {provider.bio && <p className="sd__bio">{provider.bio}</p>}
                </div>
              </Link>
            </section>

            <section className="sd__section">
              <div className="sd__reviews-head">
                <h2>Reviews</h2>
                {service.numReviews > 0 && <StarRating value={service.rating} count={service.numReviews} showValue />}
              </div>
              {reviews.length === 0 ? (
                <p className="muted">No reviews yet. Be the first to book and leave one.</p>
              ) : (
                <ul className="sd__review-list">
                  {reviews.map((review) => (
                    <li key={review._id} className="sd__review">
                      <Avatar name={review.user?.name} src={review.user?.profileImage} size="sm" />
                      <div>
                        <div className="sd__review-top">
                          <strong>{review.user?.name}</strong>
                          <StarRating value={review.rating} size={13} />
                        </div>
                        {review.comment && <p>{review.comment}</p>}
                        <time className="muted">{formatDate(review.createdAt.slice(0, 10))}</time>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="sd__booking">
            <div className="sd__booking-card">
              <span className="sd__price">{formatPrice(service.price)}</span>
              <p className="muted"><Clock size={15} /> {formatDuration(service.duration)} per visit</p>
              <Button size="lg" block onClick={handleBookClick}>Book this service</Button>
              <p className="sd__booking-note">You will choose a date and time on the next step. No payment is taken online.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;
