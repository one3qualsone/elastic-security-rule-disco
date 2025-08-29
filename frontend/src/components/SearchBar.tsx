import React from 'react';
import { EuiFieldSearch, EuiFormRow } from '@elastic/eui';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  loading = false
}) => {
  return (
    <EuiFormRow fullWidth>
      <EuiFieldSearch
        placeholder="Search rules by name, description, or data source..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        isLoading={loading}
        fullWidth
        isClearable
      />
    </EuiFormRow>
  );
};
