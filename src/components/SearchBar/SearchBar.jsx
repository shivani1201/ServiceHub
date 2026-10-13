import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import Button from '../Button/Button.jsx';
import './SearchBar.css';

const SearchBar = ({ initialValue = '', onSearch, placeholder = 'Search services', size = 'md', buttonLabel = 'Search' }) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch(value.trim());
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <form className={`searchbar searchbar--${size}`} onSubmit={handleSubmit} role="search">
      <Search size={size === 'lg' ? 20 : 18} className="searchbar__icon" aria-hidden="true" />
      <input className="searchbar__input" type="search" value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} aria-label="Search services" />
      {value && (
        <button type="button" className="searchbar__clear" onClick={handleClear} aria-label="Clear search">
          <X size={16} />
        </button>
      )}
      <Button type="submit" size={size === 'lg' ? 'lg' : 'md'}>{buttonLabel}</Button>
    </form>
  );
};

export default SearchBar;
