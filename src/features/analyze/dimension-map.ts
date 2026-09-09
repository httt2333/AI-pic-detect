/**
 * Provisional identifiers for the validated-review UI. They provide a stable
 * interface shape only; they do not assert provider capability or a final
 * production taxonomy.
 */
export const ANALYSIS_DIMENSION_IDS = [
  'A1',
  'A2',
  'A3',
  'A4',
  'A5',
  'B1',
  'B2',
  'B3',
  'B4',
  'B5',
  'B6',
  'C1',
  'C2',
  'C3',
  'C4',
  'C5',
  'C6',
] as const;

export type AnalysisDimensionId = (typeof ANALYSIS_DIMENSION_IDS)[number];

export const ANALYSIS_DIMENSIONS = [
  { id: 'A1', group: 'A', name: 'overall style impression' },
  { id: 'A2', group: 'A', name: 'overall atmosphere or template feel' },
  { id: 'A3', group: 'A', name: 'lighting logic' },
  { id: 'A4', group: 'A', name: 'color anomaly' },
  { id: 'A5', group: 'A', name: 'line quality' },
  { id: 'B1', group: 'B', name: 'hand structure' },
  { id: 'B2', group: 'B', name: 'eyes' },
  { id: 'B3', group: 'B', name: 'hair' },
  { id: 'B4', group: 'B', name: 'face' },
  { id: 'B5', group: 'B', name: 'body structure' },
  { id: 'B6', group: 'B', name: 'perspective' },
  { id: 'C1', group: 'C', name: 'material or boundary adhesion' },
  { id: 'C2', group: 'C', name: 'clothing or folds' },
  { id: 'C3', group: 'C', name: 'background or small objects' },
  { id: 'C4', group: 'C', name: 'layer completion' },
  { id: 'C5', group: 'C', name: 'penetration or structure logic' },
  { id: 'C6', group: 'C', name: 'ears, headwear, or accessories' },
] as const;
