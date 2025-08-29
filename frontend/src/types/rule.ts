export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  rule_type: 'query' | 'threshold' | 'eql' | 'machine_learning' | 'new_terms';
  query: string;
  data_sources: string[];
  mitre_tactics: string[];
  mitre_techniques: string[];
  created_date: Date | string;
  updated_date: Date | string;
  enabled?: boolean;
  false_positives?: string[];
  references?: string[];
  threat?: any[];
}
