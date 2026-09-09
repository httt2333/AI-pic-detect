import { envConfigs } from '@/config';
import { defaultTheme } from '@/config/theme';

/**
 * get active theme
 */
export function getActiveTheme(): string {
  const theme = envConfigs.theme as string;

  if (theme) {
    return theme;
  }

  return defaultTheme;
}

/**
 * load theme page
 */
export async function getThemePage(pageName: string, theme?: string) {
  const loadTheme = theme || getActiveTheme();

  try {
    // load theme page
    const module = await import(`@/themes/${loadTheme}/pages/${pageName}`);
    return module.default;
  } catch (error) {
    // fallback to default theme
    if (loadTheme !== defaultTheme) {
      try {
        const fallbackModule = await import(
          `@/themes/${defaultTheme}/pages/${pageName}`
        );
        return fallbackModule.default;
      } catch (fallbackError) {
        throw fallbackError;
      }
    }

    throw error;
  }
}

/**
 * load theme layout
 */
export async function getThemeLayout(layoutName: string, theme?: string) {
  const loadTheme = theme || getActiveTheme();

  try {
    // load theme layout
    const module = await import(`@/themes/${loadTheme}/layouts/${layoutName}`);
    return module.default;
  } catch (error) {
    // fallback to default theme
    if (loadTheme !== defaultTheme) {
      try {
        const fallbackModule = await import(
          `@/themes/${defaultTheme}/layouts/${layoutName}`
        );
        return fallbackModule.default;
      } catch (fallbackError) {
        throw fallbackError;
      }
    }

    throw error;
  }
}

/**
 * convert kebab-case to PascalCase
 */
function kebabToPascalCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * load theme block
 */
export async function getThemeBlock(blockName: string, theme?: string) {
  const loadTheme = theme || getActiveTheme();
  const pascalCaseName = kebabToPascalCase(blockName);

  try {
    // load theme block
    const module = await import(`@/themes/${loadTheme}/blocks/${blockName}`);
    // Try PascalCase named export first, then original blockName
    const component = module[pascalCaseName] || module[blockName];
    if (!component) {
      throw new Error(`No valid export found in block "${blockName}"`);
    }
    return component;
  } catch (error) {
    // fallback to default theme
    if (loadTheme !== defaultTheme) {
      try {
        const fallbackModule = await import(
          `@/themes/${defaultTheme}/blocks/${blockName}`
        );
        const fallbackComponent =
          fallbackModule[pascalCaseName] || fallbackModule[blockName];
        if (!fallbackComponent) {
          throw new Error(
            `No valid export found in fallback block "${blockName}"`
          );
        }
        return fallbackComponent;
      } catch (fallbackError) {
        throw fallbackError;
      }
    }

    throw error;
  }
}
