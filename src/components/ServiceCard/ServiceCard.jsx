import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import Avatar from '../Avatar/Avatar.jsx';
import Button from '../Button/Button.jsx';
import StarRating from '../StarRating/StarRating.jsx';
import { formatDuration, formatPrice, getCategoryMeta } from '../../utils/helpers.js';
import './ServiceCard.css';

const ServiceCard = ({ service }) => {
  const { Icon, bg, fg } = getCategoryMeta(service.category?.name);
  const provider = service.provider || {};
  return (
    <article className="svc">
      <Link to={`/services/${service._id}`} className="svc__media" style={service.image ? undefined : { background: bg, color: fg }} aria-label={`View ${service.title}`}>
        {service.image ? <img src={service.image} alt="" loading="lazy" /> : <Icon size={44} strokeWidth={1.5} />}
        {service.category?.name && <span className="svc__tag">{service.category.name}</span>}
      </Link>
      <div className="svc__body">
        <h3 className="svc__title"><Link to={`/services/${service._id}`}>{service.title}</Link></h3>
        <p className="svc__provider">
          <Avatar name={provider.name} src={provider.profileImage} size="xs" />
          {provider.name}
        </p>
        <div className="svc__meta">
          {service.numReviews > 0 ? <StarRating value={service.rating} count={service.numReviews} showValue size={14} /> : <span className="svc__new">New</span>}
          <span><Clock size={14} /> {formatDuration(service.duration)}</span>
        </div>
        <div className="svc__foot">
          <span className="svc__price">{formatPrice(service.price)}</span>
          <Button to={`/services/${service._id}`} size="sm" variant="secondary">View details</Button>
        </div>
      </div>
    </article>
  );
};

export default ServiceCard;
