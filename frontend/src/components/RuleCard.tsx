import React from 'react';
import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiText,
  EuiSpacer,
  EuiCodeBlock,
  EuiCollapsibleNav,
  EuiButton,
  EuiButtonEmpty,
  EuiPopover,
  EuiContextMenu,
  EuiIcon
} from '@elastic/eui';
import { DetectionRule } from '../types/rule';

interface RuleCardProps {
  rule: DetectionRule;
}

export const RuleCard: React.FC<RuleCardProps> = ({ rule }) => {
  const [showQuery, setShowQuery] = React.useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const footer = (
    <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
      <EuiFlexItem grow={false}>
        <EuiFlexGroup gutterSize="s" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiBadge color={getSeverityColor(rule.severity)}>
              {rule.severity.toUpperCase()}
            </EuiBadge>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge color="hollow">
              Risk: {rule.risk_score}
            </EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty
          size="xs"
          onClick={() => setShowQuery(!showQuery)}
          iconType={showQuery ? 'arrowUp' : 'arrowDown'}
        >
          {showQuery ? 'Hide Query' : 'Show Query'}
        </EuiButtonEmpty>
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  return (
    <EuiCard
      title={rule.name}
      description={rule.description}
      footer={footer}
    >
      <EuiFlexGroup gutterSize="s" wrap>
        {rule.data_sources.map((source) => (
          <EuiFlexItem grow={false} key={source}>
            <EuiBadge color="accent" iconType="compute">
              {source}
            </EuiBadge>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>

      {rule.mitre_tactics.length > 0 && (
        <>
          <EuiSpacer size="s" />
          <EuiText size="xs" color="subdued">
            <strong>MITRE Tactics:</strong> {rule.mitre_tactics.join(', ')}
          </EuiText>
        </>
      )}

      {rule.mitre_techniques.length > 0 && (
        <>
          <EuiSpacer size="xs" />
          <EuiText size="xs" color="subdued">
            <strong>MITRE Techniques:</strong> {rule.mitre_techniques.join(', ')}
          </EuiText>
        </>
      )}

      {showQuery && (
        <>
          <EuiSpacer size="m" />
          <EuiText size="s">
            <strong>Detection Query:</strong>
          </EuiText>
          <EuiSpacer size="s" />
          <EuiCodeBlock
            language="lucene"
            fontSize="s"
            paddingSize="s"
            isCopyable
          >
            {rule.query}
          </EuiCodeBlock>
        </>
      )}
    </EuiCard>
  );
};
