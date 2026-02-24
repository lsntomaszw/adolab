import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="app-shell">
      <header class="app-header">
        <div class="header-left">
          <a routerLink="/workitems" class="logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>adolab</span>
          </a>
        </div>
        <div class="header-right">
          <span class="header-hint">Azure DevOps</span>
          <button class="theme-toggle" (click)="themeService.toggle()" [title]="themeService.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
            @if (themeService.theme() === 'dark') {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2"/><path d="M12 20v2"/>
                <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
                <path d="M2 12h2"/><path d="M20 12h2"/>
                <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
              </svg>
            } @else {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            }
          </button>
        </div>
      </header>
      <main class="app-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 44px;
      padding: 0 16px;
      border-bottom: 1px solid var(--border);
      background: var(--bg-surface);
      flex-shrink: 0;
    }

    .header-left {
      display: flex;
      align-items: center;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary);
      text-decoration: none;
      font-weight: 600;
      font-size: var(--font-md);
      letter-spacing: -0.01em;

      svg { color: var(--accent); }

      &:hover { color: var(--text-primary); }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-hint {
      font-size: var(--font-xs);
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
    }

    .theme-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      background: none;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
        border-color: var(--border-light);
      }
    }

    .app-content {
      flex: 1;
      overflow-y: auto;
    }
  `]
})
export class AppComponent implements OnInit {
  themeService = inject(ThemeService);

  ngOnInit() {
    this.themeService.init();
  }
}
