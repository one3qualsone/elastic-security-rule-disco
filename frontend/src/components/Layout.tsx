import React, { useState } from 'react';
import {
  EuiPage,
  EuiPageHeader,
  EuiPageBody,
  EuiPageContent_Deprecated as EuiPageContent,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiButton,
  EuiSpacer
} from '@elastic/eui';
import { SearchBar } from './SearchBar';
import { RuleList } from './RuleList';
import { useRules } from '../hooks/useRules';

export const Layout: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { rules, loading, error, seedRules } = useRules(searchTerm);

  const handleSeedData = async () => {
    await seedRules();
  };

  return (
    <EuiPage restrictWidth="1200px">
      <EuiPageBody>
        <EuiPageHeader
          iconType="securityApp"
          pageTitle="Elastic Security Rules"
          description="Browse and search Elastic Security detection rules"
          rightSideItems={[
            <EuiButton
              key="seed"
              onClick={handleSeedData}
              iconType="importAction"
              size="s"
            >
              Load Sample Rules
            </EuiButton>
          ]}
        />
        
        <EuiPageContent>
          <EuiFlexGroup direction="column" gutterSize="l">
            <EuiFlexItem grow={false}>
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                loading={loading}
              />
            </EuiFlexItem>
            
            <EuiFlexItem>
              <RuleList
                rules={rules}
                loading={loading}
                error={error}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
