import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { DetectionRule } from '../types/rule';

interface UseRulesState {
  rules: DetectionRule[];
  loading: boolean;
  error?: string;
}

export const useRules = (searchTerm?: string) => {
  const [state, setState] = useState<UseRulesState>({
    rules: [],
    loading: true,
    error: undefined
  });

  const fetchRules = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: undefined }));
      
      const response = await apiService.getRules(searchTerm, 50);
      
      setState({
        rules: response.rules,
        loading: false,
        error: undefined
      });
    } catch (err) {
      console.error('Error fetching rules:', err);
      setState({
        rules: [],
        loading: false,
        error: 'Failed to load rules. Please try again.'
      });
    }
  }, [searchTerm]);

  const seedRules = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      await apiService.seedRules();
      
      // Refresh rules after seeding
      await fetchRules();
    } catch (err) {
      console.error('Error seeding rules:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to seed sample rules. Please try again.'
      }));
    }
  }, [fetchRules]);

  // Fetch rules when component mounts or search term changes
  useEffect(() => {
    // Debounce search to avoid too many requests
    const timeoutId = setTimeout(() => {
      fetchRules();
    }, searchTerm ? 300 : 0);

    return () => clearTimeout(timeoutId);
  }, [fetchRules]);

  return {
    ...state,
    seedRules,
    refetch: fetchRules
  };
};
