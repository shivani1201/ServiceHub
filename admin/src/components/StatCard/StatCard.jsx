import './StatCard.css';

const StatCard = ({ icon: Icon, label, value, tone = 'violet' }) => (
  <div className="statcard">
    <span className={`statcard__icon statcard__icon--${tone}`}><Icon size={20} /></span>
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  </div>
);

export default StatCard;
