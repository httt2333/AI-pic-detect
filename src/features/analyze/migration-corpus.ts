import { ANALYSIS_DIMENSIONS } from './dimension-map';

export const LEGACY_VISUAL_DIMENSIONS = ANALYSIS_DIMENSIONS;

type CorpusRecord = Readonly<Record<string, unknown>>;

export type MigrationCorpusIndex = {
  sourceRecordCount: number;
  retainedRecordCount: number;
  dimensions: Record<
    string,
    {
      evidenceCount: number;
      hitElements: string[];
    }
  >;
};

const KNOWN_DIMENSION_IDS: ReadonlySet<string> = new Set(
  LEGACY_VISUAL_DIMENSIONS.map((dimension) => dimension.id)
);

/**
 * Produces a deploy-safe summary. Raw comments and source metadata never leave
 * the caller, so this result can be used for backend configuration and tests.
 */
export function buildMigrationCorpusIndex(
  records: readonly CorpusRecord[]
): MigrationCorpusIndex {
  const dimensionEvidence = new Map<string, Set<string>>();
  let retainedRecordCount = 0;

  for (const record of records) {
    const dimensionId = record.dim_id;

    if (
      record.is_noise === true ||
      typeof dimensionId !== 'string' ||
      !KNOWN_DIMENSION_IDS.has(dimensionId)
    ) {
      continue;
    }

    retainedRecordCount += 1;

    const hitElement = record.hit_element;
    if (typeof hitElement !== 'string' || hitElement.trim().length === 0) {
      continue;
    }

    const evidence = dimensionEvidence.get(dimensionId) ?? new Set<string>();
    evidence.add(hitElement.trim());
    dimensionEvidence.set(dimensionId, evidence);
  }

  const dimensions: MigrationCorpusIndex['dimensions'] = {};
  for (const [dimensionId, hitElements] of dimensionEvidence) {
    dimensions[dimensionId] = {
      evidenceCount: [...hitElements].length,
      hitElements: [...hitElements].sort((left, right) =>
        left.localeCompare(right)
      ),
    };
  }

  return {
    sourceRecordCount: records.length,
    retainedRecordCount,
    dimensions,
  };
}
