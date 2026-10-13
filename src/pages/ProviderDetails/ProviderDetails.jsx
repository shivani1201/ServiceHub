import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Briefcase, Clock, BadgeCheck } from 'lucide-react';
import Avatar from '../../components/Avatar/Avatar.jsx';
import ServiceCard from '../../components/ServiceCard/ServiceCard.jsx';
import StarRating from '../../components/StarRating/StarRating.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import EmptyState from '../../components/EmptyState/EmptyState.jsx';
import { providerAPI, reviewAPI } from '../../services/api.js';
import { DAY_NAMES, formatDate, formatTime, getErrorMessage, pluralize } from '../../utils/helpers.js';
import './ProviderDetails.css';

const ProviderDetails = () => {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([providerAPI.getById(id), reviewAPI.getForProvider(id)])
      .then(([providerData, reviewData]) => {
        if (!active) return;
        setProvider(providerData.provider);
        setReviews(reviewData.reviews);
      })
      .catch((err) => active && setError(getErrorMessage(err, 'This provider could not be found.')))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <Loader fullPage label="Loading provider" />;

  if (error || !provider) {
    return (
      <div className="page">
        <div className="container">
          <EmptyState variant="error" title="Provider not found" message={error} actionLabel="Browse services" actionTo="/services" />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="pd__hero">
          <Avatar name={provider.name} src={provider.profileImage} size="xl" />
          <div className="pd__hero-text">
            <h1>{provider.name} <BadgeCheck size={22} /></h1>
            <p className="pd__cat">{provider.category?.name}</p>
            <div className="pd__facts">
              <span><MapPin size={15} /> {provider.location}</span>
              <span><Briefcase size={15} /> {pluralize(provider.experience, 'year')} experience</span>
            </div>
            {provider.reviewCount > 0 ? <StarRating value={provider.rating} count={provider.reviewCount} showValue /> : <span className="muted">New on ServiceHub</span>}
          </div>
        </div>

        <div className="pd__layout">
          <div className="pd__main">
            {provider.bio && (
              <section className="pd__section">
                <h2>About</h2>
                <p>{provider.bio}</p>
              </section>
            )}

            <section className="pd__section">
              <h2>Services</h2>
              {provider.services?.length > 0 ? (
                <div className="card-grid">
                  {provider.services.map((service) => <ServiceCard key={service._id} service={{ ...service, provider }} />)}
                </div>
              ) : (
                <p className="muted">No services listed yet.</p>
              )}
            </section>

            <section className="pd__section">
              <h2>Reviews</h2>
              {reviews.length === 0 ? (
                <p className="muted">No reviews yet.</p>
              ) : (
                <ul className="pd__review-list">
                  {reviews.map((review) => (
                    <li key={review._id} className="pd__review">
                      <Avatar name={review.user?.name} src={review.user?.profileImage} size="sm" />
                      <div>
                        <div className="pd__review-top">
                          <strong>{review.user?.name}</strong>
                          <StarRating value={review.rating} size={13} />
                        </div>
                        {review.service?.title && <p className="pd__review-service muted">{review.service.title}</p>}
                        {review.comment && <p>{review.comment}</p>}
                        <time className="muted">{formatDate(review.createdAt.slice(0, 10))}</time>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="pd__side">
            <div className="pd__hours-card">
              <h3><Clock size={17} /> Working hours</h3>
              <ul>
                {DAY_NAMES.map((day) => {
                  const works = provider.availability?.days?.includes(day);
                  return (
                    <li key={day} className={works ? '' : 'is-off'}>
                      <span>{day}</span>
                      <span>{works ? `${formatTime(provider.availability.startTime)} - ${formatTime(provider.availability.endTime)}` : 'Closed'}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ProviderDetails;
