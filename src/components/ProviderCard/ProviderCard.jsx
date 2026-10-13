import { Link } from 'react-router-dom';
import { BadgeCheck, MapPin, Briefcase } from 'lucide-react';
import Avatar from '../Avatar/Avatar.jsx';
import StarRating from '../StarRating/StarRating.jsx';
import { pluralize } from '../../utils/helpers.js';
import './ProviderCard.css';

const ProviderCard = ({ provider }) => (
  <article className="prov">
    <Avatar name={provider.name} src={provider.profileImage} size="lg" />
    <div className="prov__info">
      <h3 className="prov__name">
        <Link to={`/providers/${provider._id}`}>{provider.name}</Link>
        <BadgeCheck size={17} aria-label="Approved provider" />
      </h3>
      <p className="prov__cat">{provider.category?.name}</p>
      <div className="prov__facts">
        <span><MapPin size={14} /> {provider.location}</span>
        <span><Briefcase size={14} /> {pluralize(provider.experience, 'year')}</span>
      </div>
      {provider.reviewCount > 0 ? <StarRating value={provider.rating} count={provider.reviewCount} showValue size={14} /> : <span className="prov__new">New on ServiceHub</span>}
    </div>
  </article>
);

export default ProviderCard;
