import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiCallOut,
  EuiEmptyPrompt,
  EuiText
} from '@elastic/eui';
import { RuleCard } from './RuleCard';
import { DetectionRule } from '../types/rule';

interface RuleListProps {
  rules: DetectionRule[];
  loading: boolean;
  error?: string;
}

export const RuleList: React.FC<RuleListProps> = ({
  rules,
  loading,
  error
}) => {
  if (loading) {
    return (
      <EuiFlexGroup justifyContent="center" alignItems="center" style={{ minHeight: '200px' }}>
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner size="xl" />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  if (error) {
    return (
      <EuiCallOut
        title="Error loading rules"
        color="danger"
        iconType="alert"
      >
        <p>{error}</p>
      </EuiCallOut>
    );
  }

  if (rules.length === 0) {
    return (
      <EuiEmptyPrompt
        iconType="search"
        title={<h2>No rules found</h2>}
        body={
          <EuiText>
            <p>
              Try adjusting your search terms or click "Load Sample Rules" to get started.
            </p>
          </EuiText>
        }
      />
    );
  }

  return (
    <EuiFlexGroup direction="column" gutterSize="m">
      <EuiFlexItem grow={false}>
        <EuiText size="s" color="subdued">
          Found {rules.length} rule{rules.length !== 1 ? 's' : ''}
        </EuiText>
      </EuiFlexItem>
      
      {rules.map((rule) => (
        <EuiFlexItem key={rule.id} grow={false}>
          <RuleCard rule={rule} />
        </EuiFlexItem>
      ))}
    </EuiFlexGroup>
  );
};
