import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import SearchBar from '../../components/SearchBar/SearchBar.jsx';
import ServiceCard from '../../components/ServiceCard/ServiceCard.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import EmptyState from '../../components/EmptyState/EmptyState.jsx';
import Button from '../../components/Button/Button.jsx';
import { categoryAPI, serviceAPI } from '../../services/api.js';
import { getErrorMessage } from '../../utils/helpers.js';
import './Services.css';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

const Services = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState({ services: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;
  const appliedMin = searchParams.get('minPrice') || '';
  const appliedMax = searchParams.get('maxPrice') || '';

  const activeFilterCount = [category, appliedMin, appliedMax].filter(Boolean).length;

  const updateParams = (changes, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (resetPage) next.delete('page');
    setSearchParams(next);
  };

  useEffect(() => {
    categoryAPI.getAll().then((data) => setCategories(data.categories)).catch(() => {});
  }, []);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await serviceAPI.getAll({
        search: search || undefined,
        category: category || undefined,
        minPrice: appliedMin || undefined,
        maxPrice: appliedMax || undefined,
        sort,
        page,
        limit: 12,
      });
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load services.'));
    } finally {
      setLoading(false);
    }
  }, [search, category, appliedMin, appliedMax, sort, page]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const activeCategory = useMemo(() => categories.find((item) => item._id === category), [categories, category]);

  const applyPriceFilter = (event) => {
    event.preventDefault();
    updateParams({ minPrice, maxPrice });
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSearchParams((params) => {
      const next = new URLSearchParams(params);
      ['category', 'minPrice', 'maxPrice', 'page'].forEach((key) => next.delete(key));
      return next;
    });
  };

  const heading = search ? `Results for "${search}"` : activeCategory ? activeCategory.name : 'All services';

  return (
    <div className="page">
      <div className="container">
        <div className="page__head">
          <h1>{heading}</h1>
          <p>Compare price, duration and reviews, then book a time that suits you.</p>
        </div>

        <div className="svcs__bar">
          <SearchBar initialValue={search} onSearch={(value) => updateParams({ search: value })} />
          <div className="svcs__bar-right">
            <select className="select svcs__sort" value={sort} onChange={(event) => updateParams({ sort: event.target.value }, false)}>
              {SORTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button type="button" className="btn btn--outline btn--md svcs__filter-btn" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && <span className="svcs__filter-count">{activeFilterCount}</span>}
            </button>
          </div>
        </div>

        <div className="svcs__layout">
          <aside className={`svcs__filters ${filtersOpen ? 'is-open' : ''}`}>
            <div className="svcs__filters-head">
              <h2>Filters</h2>
              <button type="button" className="svcs__filters-close" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                <X size={20} />
              </button>
            </div>

            <div className="svcs__filter-group">
              <h3>Category</h3>
              <ul className="svcs__cat-list">
                <li>
                  <button type="button" className={!category ? 'is-active' : ''} onClick={() => updateParams({ category: '' })}>All categories</button>
                </li>
                {categories.map((item) => (
                  <li key={item._id}>
                    <button type="button" className={category === item._id ? 'is-active' : ''} onClick={() => updateParams({ category: item._id })}>{item.name}</button>
                  </li>
                ))}
              </ul>
            </div>

            <form className="svcs__filter-group" onSubmit={applyPriceFilter}>
              <h3>Price</h3>
              <div className="svcs__price-inputs">
                <div className="field">
                  <label htmlFor="minPrice">Min</label>
                  <input id="minPrice" type="number" min="0" className="input" placeholder="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="maxPrice">Max</label>
                  <input id="maxPrice" type="number" min="0" className="input" placeholder="Any" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} />
                </div>
              </div>
              <Button type="submit" size="sm" variant="secondary" block>Apply price</Button>
            </form>

            {activeFilterCount > 0 && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear all filters</Button>}
          </aside>

          {filtersOpen && <div className="svcs__scrim" onClick={() => setFiltersOpen(false)} />}

          <div className="svcs__results">
            {error ? (
              <EmptyState variant="error" title="Something went wrong" message={error} actionLabel="Try again" onAction={loadServices} />
            ) : loading ? (
              <Loader variant="cards" count={6} label="Loading services" />
            ) : result.services.length === 0 ? (
              <EmptyState title="No services match your filters" message="Try a different category, widen your price range, or clear your filters." actionLabel="Clear filters" onAction={clearFilters} />
            ) : (
              <>
                <p className="svcs__count muted">{result.total} service{result.total === 1 ? '' : 's'} found</p>
                <div className="card-grid">
                  {result.services.map((service) => <ServiceCard key={service._id} service={service} />)}
                </div>
                {result.pages > 1 && (
                  <nav className="pager" aria-label="Pagination">
                    <button type="button" className="pager__btn" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) }, false)}>Previous</button>
                    <span className="pager__status">Page {page} of {result.pages}</span>
                    <button type="button" className="pager__btn" disabled={page >= result.pages} onClick={() => updateParams({ page: String(page + 1) }, false)}>Next</button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
