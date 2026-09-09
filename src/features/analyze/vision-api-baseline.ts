type BaselineCase = {
  id: string;
  source: {
    reference: string;
    verification: 'historical_human_correction';
  };
  expected: { outcome: 'no_issue'; category: null; requirements: [] };
  prohibitedAssertions: string[];
};

/**
 * Historical human-review constraints for future opt-in vision API tests.
 * Image assets and prior model responses intentionally do not live in the repo.
 */
export const VISION_API_BASELINE_CASES: BaselineCase[] = [
  {
    id: 'symmetric-eye-highlights-are-not-a-defect',
    source: {
      reference: '09_记忆与规范/踩坑记录/踩坑_B_人眼判定与语料引用.md: B1',
      verification: 'historical_human_correction',
    },
    expected: { outcome: 'no_issue', category: null, requirements: [] },
    prohibitedAssertions: [
      'unverified_directional_claim',
      'ai_origin_determination',
    ],
  },
  {
    id: 'uncertain-or-hidden-region-must-not-be-guessed',
    source: {
      reference: '09_记忆与规范/踩坑记录/踩坑_B_人眼判定与语料引用.md: B5',
      verification: 'historical_human_correction',
    },
    expected: { outcome: 'no_issue', category: null, requirements: [] },
    prohibitedAssertions: ['unverified_directional_claim'],
  },
  {
    id: 'ambiguous-image-must-not-be-filled-with-invented-issues',
    source: {
      reference: '09_记忆与规范/踩坑记录/踩坑_B_人眼判定与语料引用.md: B2, B4',
      verification: 'historical_human_correction',
    },
    expected: { outcome: 'no_issue', category: null, requirements: [] },
    prohibitedAssertions: [
      'forced_issue_count',
      'unverified_directional_claim',
      'ai_origin_determination',
    ],
  },
];
