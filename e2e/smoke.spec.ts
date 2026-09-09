import { expect, test } from '@playwright/test';

test('a creator can begin a single-image review from the public landing page', async ({
  page,
}) => {
  const response = await page.goto('/');

  expect(response?.ok()).toBe(true);
  await expect(
    page.getByRole('heading', {
      name: '发布前，先把局部问题看清楚。',
    })
  ).toBeVisible();

  await page.getByRole('button', { name: '上传图片开始检查' }).click();
  await expect(page.getByLabel('选择要检查的图片')).toBeVisible();

  await page.getByRole('link', { name: '使用流程' }).click();
  await expect(
    page.getByRole('heading', { name: '从图片到可执行的修改建议' })
  ).toBeVisible();
});

test('a creator can review a marked local issue in the result workspace', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: '上传图片开始检查' }).click();
  await page
    .getByLabel('选择要检查的图片')
    .setInputFiles('public/images/ai-pic-detect/hero-review-sample.png');

  await expect(page.getByRole('button', { name: '开始分析' })).toBeEnabled();
  await page.getByRole('button', { name: '开始分析' }).click();

  await expect(page.getByRole('heading', { name: '检查结果' })).toBeVisible();
  await expect(page.getByText('修改优先级', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '定位问题 1' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '检查维度' })).toBeVisible();

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
    page.getByRole('heading', { name: '购买检查额度' })
  ).toBeVisible();
  await expect(page.getByText('50 次检查额度')).toBeVisible();
  await expect(page.getByText('价格待定')).toHaveCount(3);
  await expect(page.getByText('CNY · ¥')).toHaveCount(3);
  await expect(
    page.getByRole('button', { name: '支付接入准备中' }).first()
  ).toBeDisabled();
});
