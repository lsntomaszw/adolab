import { Injectable, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private static STORAGE_KEY = 'adolab-theme';

  theme = signal<Theme>(this.loadTheme());

  private loadTheme(): Theme {
    const saved = localStorage.getItem(ThemeService.STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  }

  toggle() {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem(ThemeService.STORAGE_KEY, next);
    this.applyTheme(next);
  }

  init() {
    this.applyTheme(this.theme());
  }

  private applyTheme(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
