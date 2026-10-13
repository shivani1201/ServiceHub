import { useState } from 'react';
import Modal from '../Modal/Modal.jsx';
import Button from '../Button/Button.jsx';
import StarRating from '../StarRating/StarRating.jsx';
import { reviewAPI } from '../../services/api.js';
import { getErrorMessage } from '../../utils/helpers.js';
import { useToast } from '../../context/ToastContext.jsx';
import './ReviewModal.css';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

const ReviewModal = ({ booking, open, onClose, onSubmitted }) => {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!booking) return null;

  const resetForm = () => {
    setRating(0);
    setComment('');
    setError('');
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!rating) {
      setError('Choose a star rating first.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await reviewAPI.create({ booking: booking._id, rating, comment });
      toast.success('Review posted');
      onSubmitted(booking._id);
      resetForm();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'We could not post your review.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="How was your booking?"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>Not now</Button>
          <Button onClick={handleSubmit} loading={submitting}>Post review</Button>
        </>
      }
    >
      <p className="review__service">{booking.service?.title}</p>
      <div className="review__stars">
        <StarRating interactive size={32} value={rating} onChange={setRating} />
        <span className="review__label">{LABELS[rating] || 'Tap a star'}</span>
      </div>
      <div className="field">
        <label htmlFor="review-comment">Tell others about it (optional)</label>
        <textarea id="review-comment" className="textarea" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} placeholder="What went well? Was the provider on time?" />
        <span className="field__hint">{comment.length}/500</span>
      </div>
      {error && <div className="alert alert--error review__error" role="alert">{error}</div>}
    </Modal>
  );
};

export default ReviewModal;
