// Theme configurations for JSXGraph

export interface JSXGraphTheme {
  backgroundColor: string;
  axisColor: string;
  gridColor: string;
  tickLabelColor: string;
  functionColor: string;
  identityLineColor: string;
}

export const themes: Record<'dark' | 'light', JSXGraphTheme> = {
  dark: {
    backgroundColor: 'transparent',
    axisColor: '#64748b',
    gridColor: 'rgba(255,255,255,0.1)',
    tickLabelColor: '#94a3b8',
    functionColor: '#a855f7',
    identityLineColor: '#6b7280',
  },
  light: {
    backgroundColor: '#f8fafc',
    axisColor: '#64748b',
    gridColor: 'rgba(0,0,0,0.08)',
    tickLabelColor: '#475569',
    functionColor: '#7c3aed',
    identityLineColor: '#94a3b8',
  },
};

export function getTheme(isDark: boolean): JSXGraphTheme {
  return isDark ? themes.dark : themes.light;
}
