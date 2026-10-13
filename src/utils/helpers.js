import { Scissors, Home, Dumbbell, Sparkles, Wrench, GraduationCap, Leaf, Layers } from 'lucide-react';

const CATEGORY_META = {
  beauty: { Icon: Scissors, bg: '#fbe6ef', fg: '#b03a72' },
  home: { Icon: Home, bg: '#ffe6dc', fg: '#d2492f' },
  fitness: { Icon: Dumbbell, bg: '#e8e1fb', fg: '#3f2a9e' },
  cleaning: { Icon: Sparkles, bg: '#dff3ea', fg: '#17805a' },
  repair: { Icon: Wrench, bg: '#fff0cf', fg: '#9a5f08' },
  education: { Icon: GraduationCap, bg: '#e2ecfd', fg: '#2c5fc9' },
  wellness: { Icon: Leaf, bg: '#e6f4d9', fg: '#3d7a22' },
};

export const getCategoryMeta = (name = '') => {
  const key = Object.keys(CATEGORY_META).find((k) => name.toLowerCase().includes(k));
  return CATEGORY_META[key] || { Icon: Layers, bg: '#f3f0fd', fg: '#3f2a9e' };
};

const CURRENCY = import.meta.env.VITE_CURRENCY || 'USD';

export const formatPrice = (amount = 0) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);

export const formatDuration = (minutes = 0) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins} min`;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
};

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const parseDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const toDateString = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const formatDate = (dateStr) =>
  parseDate(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

export const getDateParts = (dateStr) => {
  const date = parseDate(dateStr);
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    day: date.getDate(),
  };
};

export const formatTime = (time = '00:00') => {
  const [hours, minutes] = time.split(':').map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
};

export const getNextDays = (count = 14) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return date;
  });

export const BOOKING_STATUS = {
  pending: { label: 'Pending', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  rejected: { label: 'Declined', tone: 'danger' },
};

export const getInitials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join('') || '?';

export const pluralize = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.request && !error?.response) {
    return 'We could not reach the server. Check that the backend is running, then try again.';
  }
  return fallback;
};
