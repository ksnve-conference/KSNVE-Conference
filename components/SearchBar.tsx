import Icon from '@/components/Icon';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export default function SearchBar({ value, onChange, placeholder = '제목, 저자, 발표자, 세션, 장소 검색', autoFocus = false }: Props) {
  return (
    <label className="search-wrap">
      <span className="sr-only">학술대회 검색</span>
      <span className="search-icon"><Icon name="search" size={18} /></span>
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        className="search"
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button type="button" className="search-clear" aria-label="검색어 지우기" onClick={() => onChange('')}>
          <Icon name="close" size={15} />
        </button>
      )}
    </label>
  );
}
