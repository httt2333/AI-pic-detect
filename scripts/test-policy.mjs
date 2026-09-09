function isTestFile(file) {
  return (
    /(?:^|\/)(?:e2e|tests)\//u.test(file) ||
    /\.(?:test|spec|integration)\.(?:ts|tsx|js|jsx)$/u.test(file)
  );
}

function isProductionSourceFile(file) {
  return (
    file.startsWith('src/') &&
    /\.(?:ts|tsx|js|jsx)$/u.test(file) &&
    !isTestFile(file) &&
    !file.endsWith('.d.ts')
  );
}

export function evaluateTestPolicy(changes) {
  const productionChanges = changes
    .filter((change) => change.status !== 'D')
    .map((change) => change.path)
    .filter(isProductionSourceFile);
  const hasChangedTest = changes.some(
    (change) => change.status !== 'D' && isTestFile(change.path)
  );

  return {
    ok: productionChanges.length === 0 || hasChangedTest,
    productionChanges,
  };
}
