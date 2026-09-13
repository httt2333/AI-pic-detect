import { expect, test, type Page } from '@playwright/test';

import { getMockAnalysisResponse } from '../src/features/ai-pic-detect/mock';

const image = 'public/images/ai-pic-detect/hero-review-sample.png';
test('landing preview is honest about its scope and displayed locations', async ({
  page,
}) => {
  await page.goto('/zh');
  const preview = page.getByTestId('workspace-preview');
  await expect(preview.getByText('示例结果', { exact: true })).toBeVisible();
  await expect(preview.getByTestId('preview-location')).toHaveCount(2);
  await expect(preview).not.toContainText('10%');
  await expect(preview.getByRole('button')).toHaveCount(0);
  await expect(
    preview.getByText('静态示例 · 上传图片后可确认或排除疑点')
  ).toBeVisible();
});

async function selectImage(page: Page) {
  await page.getByLabel('选择要检查的图片').setInputFiles(image);
  await page
    .getByRole('main')
    .getByRole('button', { name: '开始检查', exact: true })
    .click();
}
async function openUpload(page: Page) {
  await page.goto('/zh');
  await page.getByRole('button', { name: '上传图片开始检查' }).first().click();
}

test('desktop: image, elapsed time, six issues, synchronized decisions and clean next review', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const result = getMockAnalysisResponse();
  result.issues = [
    ...result.issues,
    ...result.issues.map((issue, i) => ({
      ...issue,
      id: `extra_${i}`,
      title: `另一个局部 ${i + 1}`,
    })),
  ];
  result.summary = { issue_count: 6, high_priority_count: 2 };
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/ai-pic-detect/analyze', async (route) => {
    await pending;
    await route.fulfill({ json: result });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openUpload(page);
  await selectImage(page);
  await expect(
    page.getByRole('heading', { name: '正在检查容易被忽略的细节' })
  ).toBeVisible();
  await expect(page.getByRole('timer')).toHaveText(/已等待 [1-9] 秒/);
  const original = page.getByAltText('待检查的二次元人物图');
  await expect
    .poll(() =>
      original.evaluate((element: HTMLImageElement) => element.naturalWidth)
    )
    .toBeGreaterThan(0);
  await page.screenshot({ path: testInfo.outputPath('desktop-waiting.png') });
  release();
  await expect(
    page.getByRole('heading', { name: '检查结果', exact: true })
  ).toBeVisible();
  expect(
    (await page
      .getByRole('heading', { name: '检查结果', exact: true })
      .boundingBox())!.y
  ).toBeGreaterThanOrEqual(64);
  await expect(page.getByText('发现 6 处值得看的疑点')).toBeVisible();
  await expect(page.getByRole('button', { name: /^定位疑点/ })).toHaveCount(6);
  await expect(page.getByRole('button', { name: /^疑点 \d/ })).toHaveCount(6);
  await page.getByRole('button', { name: '看下一处' }).click();
  await expect(page.getByText(/已确认|已排除/)).toHaveCount(0);
  const rows = page.getByRole('button', { name: /^疑点 \d/ });
  const secondName = await rows.nth(1).getAttribute('aria-label');
  await expect(
    page.getByRole('heading', { name: secondName!.split('：')[1], exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: '定位疑点 2', exact: true })
  ).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({
    path: testInfo.outputPath('desktop-result.png'),
    fullPage: true,
  });
  for (let i = 0; i < 6; i += 1) {
    await rows.nth(i).click();
    await page
      .getByRole('button', {
        name: i % 2 ? '排除疑点' : '确认疑点',
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole('heading', { name: '这次检查完成了' })
  ).toBeVisible();
  await page.getByRole('button', { name: '检查另一张图片' }).click();
  await expect(page.getByAltText('待检查图片预览')).toHaveCount(0);
  await expect(
    page
      .getByRole('main')
      .getByRole('button', { name: '开始检查', exact: true })
  ).toBeDisabled();
  expect(errors).toEqual([]);
  await expect(page.getByText(/^[1-9] Issues?$/)).toHaveCount(0);
});

test('mobile: validation, no_issue and recovery stay within the viewport', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/ai-pic-detect/analyze', (route) =>
    route.fulfill({ json: getMockAnalysisResponse('no_issue') })
  );
  await openUpload(page);
  await page.getByLabel('选择要检查的图片').setInputFiles({
    name: 'unsupported.gif',
    mimeType: 'image/gif',
    buffer: Buffer.from('GIF89a'),
  });
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    '仅支持 PNG、JPG 和 WebP'
  );
  await selectImage(page);
  await expect(
    page.getByRole('heading', { name: '这次没有发现足够明确的疑点' })
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('mobile-no-issue.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: '检查另一张图片' }).click();
  await expect(
    page.getByRole('heading', { name: '上传一张 AI 图' })
  ).toBeVisible();
});

test('incomplete success data has a recovery path, retry resets waiting and can finish', async ({
  page,
}) => {
  let attempts = 0;
  await page.route('**/api/ai-pic-detect/analyze', (route) => {
    attempts += 1;
    return route.fulfill({
      json:
        attempts === 1
          ? { status: 'success', issues: [] }
          : getMockAnalysisResponse('no_issue'),
    });
  });
  await openUpload(page);
  await selectImage(page);
  await expect(
    page.getByRole('heading', { name: '这次检查没有完成' })
  ).toBeVisible();
  await page.getByRole('button', { name: '再试一次' }).click();
  await expect(
    page.getByRole('heading', { name: '这次没有发现足够明确的疑点' })
  ).toBeVisible();
  expect(attempts).toBe(2);
});
