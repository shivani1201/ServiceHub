import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Clock, BadgeCheck, Tag, CalendarCheck } from 'lucide-react';
import SearchBar from '../../components/SearchBar/SearchBar.jsx';
import CategoryCard from '../../components/CategoryCard/CategoryCard.jsx';
import ServiceCard from '../../components/ServiceCard/ServiceCard.jsx';
import ProviderCard from '../../components/ProviderCard/ProviderCard.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Button from '../../components/Button/Button.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import EmptyState from '../../components/EmptyState/EmptyState.jsx';
import { categoryAPI, serviceAPI, providerAPI } from '../../services/api.js';
import { formatPrice, formatTime, getErrorMessage, getNextDays } from '../../utils/helpers.js';
import './Home.css';

const SLOT_TIMES = ['09:00', '11:00', '14:00', '16:00'];
const TAKEN_SLOT = '11:00';

const STEPS = [
  { title: 'Search or browse', text: 'Filter by category and price, and read reviews from customers who have already booked.' },
  { title: 'Choose an open time', text: 'See when the provider is really free and pick a slot that suits you.' },
  { title: 'Get it done', text: 'Your provider confirms the booking. Afterwards, leave a review to help the next customer.' },
];

const REASONS = [
  { icon: BadgeCheck, title: 'Providers are checked first', text: 'Every profile is reviewed by our team before it goes live on the site.' },
  { icon: Tag, title: 'The price is on the page', text: 'Each service lists its price and duration, so there are no surprise quotes.' },
  { icon: CalendarCheck, title: 'Times that are really free', text: 'A slot disappears the moment someone books it, so there is no back and forth.' },
  { icon: Star, title: 'Reviews from real bookings', text: 'Only customers who finished a booking can leave a review.' },
];

const QUOTES = [
  { tone: 'lavender', name: 'Priya S.', role: 'Homeowner', text: 'I booked a deep clean on Tuesday night and it was done by Thursday afternoon. No phone calls at all.' },
  { tone: 'white', name: 'Marcus T.', role: 'Renter', text: 'Seeing the exact free slots saved me so much messaging. I picked one and it was confirmed within the hour.' },
  { tone: 'peach', name: 'Elena R.', role: 'Parent', text: 'The reviews made it easy to choose a maths tutor for my daughter. Her grades are already better.' },
];

const Home = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const days = useMemo(() => getNextDays(4).slice(1), []);
  const [dayIndex, setDayIndex] = useState(0);
  const [slot, setSlot] = useState('14:00');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [categoryData, serviceData, providerData] = await Promise.all([
        categoryAPI.getAll(),
        serviceAPI.getAll({ limit: 6, sort: 'rating' }),
        providerAPI.getAll({ limit: 4 }),
      ]);
      setCategories(categoryData.categories);
      setServices(serviceData.services);
      setProviders(providerData.providers);
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load services right now.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (query) => {
    navigate(query ? `/services?search=${encodeURIComponent(query)}` : '/services');
  };

  const pickedDay = days[dayIndex];
  const summary = `${pickedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at ${formatTime(slot)}`;

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <h1>Find a local pro and book a time that works.</h1>
            <p className="hero__lead">Cleaners, tutors, trainers, technicians and more. Compare prices and reviews, then pick an open slot.</p>
            <div className="hero__search">
              <SearchBar size="lg" onSearch={handleSearch} placeholder="What do you need help with?" />
            </div>
            {categories.length > 0 && (
              <div className="hero__chips">
                <span>Popular:</span>
                {categories.slice(0, 4).map((category) => (
                  <Link key={category._id} to={`/services?category=${category._id}`} className="hero__chip">{category.name}</Link>
                ))}
              </div>
            )}
          </div>

          <div className="hero__visual">
            <div className="hero__arch" aria-hidden="true" />
            <div className="hero__dot" aria-hidden="true" />
            <div className="slip">
              <div className="slip__top">
                <div className="slip__provider">
                  <Avatar name="Ana Costa" size="sm" />
                  <div>
                    <strong>Ana Costa</strong>
                    <span>Cleaning in Lakeview</span>
                  </div>
                  <span className="slip__rating"><Star size={14} fill="currentColor" /> 4.9</span>
                </div>
                <h2 className="slip__title">Deep home cleaning</h2>
                <p className="slip__meta"><Clock size={15} /> 3 hours<span className="slip__price">{formatPrice(90)}</span></p>
              </div>
              <div className="slip__bottom">
                <p className="slip__label">Pick a day</p>
                <div className="slip__days" role="group" aria-label="Day">
                  {days.map((day, index) => (
                    <button type="button" key={day.toISOString()} className="slip__day" aria-pressed={index === dayIndex} onClick={() => setDayIndex(index)}>
                      <small>{day.toLocaleDateString('en-US', { weekday: 'short' })}</small>
                      <strong>{day.getDate()}</strong>
                    </button>
                  ))}
                </div>
                <p className="slip__label">Pick a time</p>
                <div className="slip__times" role="group" aria-label="Time">
                  {SLOT_TIMES.map((time) => (
                    <button type="button" key={time} className="slip__time" aria-pressed={time === slot} disabled={time === TAKEN_SLOT} onClick={() => setSlot(time)}>
                      {formatTime(time)}
                    </button>
                  ))}
                </div>
                <div className="slip__confirm">
                  <p className="slip__summary">Your slot<strong>{summary}</strong></p>
                  <Button to="/services" size="sm">See open times</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <section className="section">
          <div className="container">
            <EmptyState variant="error" title="We could not load services" message={error} actionLabel="Try again" onAction={loadData} />
          </div>
        </section>
      ) : (
        <>
          <section className="section home-categories">
            <div className="container">
              <div className="section-head">
                <div>
                  <h2>Browse by category</h2>
                  <p>Start with what you need. Every provider is reviewed before they appear here.</p>
                </div>
              </div>
              {loading ? (
                <Loader variant="cards" count={4} label="Loading categories" />
              ) : categories.length === 0 ? (
                <EmptyState title="No categories yet" message="Categories will show up here as soon as they are added." />
              ) : (
                <div className="cat-grid">
                  {categories.map((category) => <CategoryCard key={category._id} category={category} />)}
                </div>
              )}
            </div>
          </section>

          <section className="section home-services">
            <div className="container">
              <div className="section-head">
                <div>
                  <h2>Top-rated services</h2>
                  <p>The services customers rate highest right now.</p>
                </div>
                <Link to="/services" className="text-link">See all services</Link>
              </div>
              {loading ? (
                <Loader variant="cards" count={3} label="Loading services" />
              ) : services.length === 0 ? (
                <EmptyState title="No services yet" message="Check back soon. New services are added all the time." />
              ) : (
                <div className="card-grid">
                  {services.map((service) => <ServiceCard key={service._id} service={service} />)}
                </div>
              )}
            </div>
          </section>

          {(loading || providers.length > 0) && (
            <section className="section home-providers">
              <div className="container">
                <div className="section-head">
                  <div>
                    <h2>Meet the providers</h2>
                    <p>Local professionals with real reviews and clear availability.</p>
                  </div>
                </div>
                {loading ? <Loader label="Loading providers" /> : (
                  <div className="prov-grid">
                    {providers.map((provider) => <ProviderCard key={provider._id} provider={provider} />)}
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}

      <section className="section home-band">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>How booking works</h2>
              <p>From search to finished job in three steps.</p>
            </div>
          </div>
          <ol className="steps">
            {STEPS.map((step, index) => (
              <li className="step" key={step.title}>
                <span className="step__num">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container why">
          <div className="why__intro">
            <h2>Local services, without the guesswork.</h2>
            <p>Hiring someone new should not feel like a gamble. ServiceHub puts the details you need in front of you before you book.</p>
          </div>
          <ul className="why__list">
            {REASONS.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="why__icon"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section home-quotes">
        <div className="container">
          <div className="section-head">
            <div><h2>What customers say</h2></div>
          </div>
          <div className="quotes">
            {QUOTES.map((quote) => (
              <figure key={quote.name} className={`quote quote--${quote.tone}`}>
                <blockquote>{quote.text}</blockquote>
                <figcaption>
                  <Avatar name={quote.name} size="sm" />
                  <span>
                    <strong>{quote.name}</strong>
                    <small>{quote.role}</small>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta">
        <div className="container">
          <div className="cta">
            <h2>Offer a service? Start taking bookings.</h2>
            <p>Create a provider account, list what you do and let customers book the times you have free.</p>
            <div className="cta__actions">
              <Button to="/register?type=provider" variant="accent" size="lg">Become a provider</Button>
              <Button to="/services" variant="light" size="lg">Browse services</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
