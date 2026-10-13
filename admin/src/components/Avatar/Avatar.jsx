import { useState } from 'react';
import { getInitials } from '../../utils/helpers.js';
import './Avatar.css';

const TINTS = [
  ['#e8e1fb', '#3f2a9e'], ['#ffe6dc', '#c4452d'], ['#dff3ea', '#17805a'],
  ['#fff0cf', '#9a5f08'], ['#e2ecfd', '#2c5fc9'], ['#fbe6ef', '#b03a72'],
];
const tintFor = (name = '') => TINTS[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % TINTS.length];

const Avatar = ({ name = '', src = '', size = 'md' }) => {
  const [failed, setFailed] = useState(false);
  const [background, color] = tintFor(name);
  if (src && !failed) {
    return <img src={src} alt={name} className={`avatar avatar--${size}`} onError={() => setFailed(true)} loading="lazy" />;
  }
  return (
    <span className={`avatar avatar--${size}`} style={{ background, color }} aria-label={name}>
      {getInitials(name)}
    </span>
  );
};

export default Avatar;
