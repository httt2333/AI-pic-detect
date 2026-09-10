import { expect, test } from '@playwright/test';

import { getMockAnalysisResponse } from '../src/features/ai-pic-detect/mock';

test('a creator can begin a single-image review from the public landing page', async ({
  page,
}) => {
  const response = await page.goto('/');

  expect(response?.ok()).toBe(true);
  await expect(
    page.getByRole('heading', {
      name: '让 AI 图更经得住细看。',
    })
  ).toBeVisible();

  await expect(page.getByText('AI IMAGE REVIEW FOR ANIME CREATORS')).toBeVisible();
  const heroScanner = page.getByRole('slider', { name: '拖动扫描示例图' });
  await expect(heroScanner).toHaveValue('100');
  await expect(
    page.getByText('发现 2 处需要注意的细节')
  ).toBeHidden();
  await heroScanner.fill('60');
  await expect(
    page.getByText('发现 2 处需要注意的细节')
  ).toBeVisible();
  await expect(page.getByRole('link', { name: '查看示例' })).toHaveAttribute(
    'href',
    '#review-story'
  );

  await page.getByRole('button', { name: '上传图片开始检查' }).first().click();
  await expect(page.getByLabel('选择要检查的图片')).toBeVisible();

  await page.getByRole('link', { name: '怎么检查' }).click();
  await expect(
    page.getByRole('heading', { name: '先看哪里值得改。' })
  ).toBeVisible();
});

test('the landing story remains usable on a narrow mobile viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: '让 AI 图更经得住细看。',
    })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: '上传图片开始检查' }).first()
  ).toBeVisible();
  await expect(page.getByRole('link', { name: '查看示例' })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test('the hero scan automatically reaches its result state', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('slider', { name: '拖动扫描示例图' })
  ).toHaveValue('0', { timeout: 5_000 });
  await expect(
    page.getByText('发现 2 处需要注意的细节')
  ).toBeVisible();
});

test('the large story visual stays visible while the desktop story advances', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');

  const story = page.locator('#review-story');
  const visual = page.getByTestId('story-sticky-visual');
  await story.evaluate((element) => {
    window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY,
      behavior: 'auto',
    });
  });

  const initialTop = (await visual.boundingBox())?.y;
  await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'auto' }));
  const advancedTop = (await visual.boundingBox())?.y;

  expect(initialTop).toBeDefined();
  expect(advancedTop).toBeDefined();
  expect(Math.abs((advancedTop ?? 0) - (initialTop ?? 0))).toBeLessThan(3);
});

test('a creator can review a marked local issue in the result workspace', async ({
  page,
}) => {
  await page.route('**/api/ai-pic-detect/analyze', async (route) => {
    await route.fulfill({ json: getMockAnalysisResponse() });
  });
  await page.goto('/');
  await page.getByRole('button', { name: '上传图片开始检查' }).first().click();
  await page
    .getByLabel('选择要检查的图片')
    .setInputFiles('public/images/ai-pic-detect/hero-review-sample.png');

  await expect(page.getByRole('button', { name: '开始分析' })).toBeEnabled();
  await page.getByRole('button', { name: '开始分析' }).click();

  await expect(page.getByRole('heading', { name: '检查结果' })).toBeVisible();
  await expect(page.getByText('修改优先级', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '定位问题 1' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '详细检查报告' })
  ).toBeVisible();

  await page.getByRole('button', { name: '问题 2：眼部比例建议检查' }).click();
  await expect(
    page.getByRole('heading', { name: '眼部比例建议检查' })
  ).toBeVisible();
  await page.getByRole('button', { name: '定位维度 B1 手部结构' }).click();
  await expect(
    page.getByRole('heading', { name: '手部结构需要检查' })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: '下一项' })).toBeVisible();
});

test('a creator can view configured credit packs without starting an unavailable payment', async ({
  page,
}) => {
  await page.goto('/zh/pricing');

  await expect(page.getByRole('banner')).toHaveClass(/fixed/);
  await expect(page.getByRole('link', { name: '怎么检查' })).toHaveAttribute(
    'href',
    '/#how-it-works'
  );
  await expect(page.getByRole('link', { name: '产品边界' })).toHaveAttribute(
    'href',
    '/#boundaries'
  );

  await expect(
    page.getByRole('heading', { name: '购买检查额度', level: 2 })
  ).toBeVisible();
  await expect(page.getByText('50 次检查额度')).toBeVisible();
  await expect(page.getByText('价格待定')).toHaveCount(3);
  await expect(page.getByText('CNY · ¥')).toHaveCount(3);
  await expect(
    page.getByRole('button', { name: '支付接入准备中' }).first()
  ).toBeDisabled();
  await expect(page.getByRole('link', { name: '开始检查' })).toHaveAttribute(
    'href',
    '/'
  );
});
