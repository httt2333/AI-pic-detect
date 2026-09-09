import { expect, test } from '@playwright/test';

test('a creator can begin a single-image review from the public landing page', async ({
  page,
}) => {
  const response = await page.goto('/');

  expect(response?.ok()).toBe(true);
  await expect(
    page.getByRole('heading', {
      name: '你看不出来的 AI 痕迹，先替你找出来。',
    })
  ).toBeVisible();

  await expect(page.getByText('AI IMAGE REVIEW FOR CREATORS')).toBeVisible();
  await expect(page.getByRole('link', { name: '查看示例' })).toHaveAttribute(
    'href',
    '#review-story'
  );

  await page.getByRole('button', { name: '上传图片开始检查' }).first().click();
  await expect(page.getByLabel('选择要检查的图片')).toBeVisible();

  await page.getByRole('link', { name: '使用流程' }).click();
  await expect(
    page.getByRole('heading', { name: '找出你自己漏看的地方' })
  ).toBeVisible();
});

test('the landing story remains usable on a narrow mobile viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: '你看不出来的 AI 痕迹，先替你找出来。',
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

test('a creator can review a marked local issue in the result workspace', async ({
  page,
}) => {
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

  await expect(
    page.getByRole('heading', { name: '购买检查额度', level: 2 })
  ).toBeVisible();
  await expect(page.getByText('50 次检查额度')).toBeVisible();
  await expect(page.getByText('价格待定')).toHaveCount(3);
  await expect(page.getByText('CNY · ¥')).toHaveCount(3);
  await expect(
    page.getByRole('button', { name: '支付接入准备中' }).first()
  ).toBeDisabled();
  await expect(
    page.getByRole('link', { name: '返回图片检查' })
  ).toHaveAttribute('href', '/');
});
