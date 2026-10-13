import { Link } from 'react-router-dom';
import { getCategoryMeta, pluralize } from '../../utils/helpers.js';
import './CategoryCard.css';

const CategoryCard = ({ category }) => {
  const { Icon, bg, fg } = getCategoryMeta(category.name);
  return (
    <Link to={`/services?category=${category._id}`} className="cat" style={{ background: bg, '--cat-fg': fg }}>
      <span className="cat__icon"><Icon size={24} /></span>
      <span className="cat__text">
        <h3>{category.name}</h3>
        <span>{pluralize(category.serviceCount ?? 0, 'service')}</span>
      </span>
    </Link>
  );
};

export default CategoryCard;
