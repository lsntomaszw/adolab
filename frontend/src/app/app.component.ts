import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatIconModule, MatButtonModule],
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <button mat-icon-button routerLink="/sync">
        <mat-icon>dashboard</mat-icon>
      </button>
      <span class="title" routerLink="/sync">adolab</span>
      <span class="spacer"></span>
      <span class="subtitle">Azure DevOps Work Items</span>
    </mat-toolbar>
    <main class="content">
      <router-outlet />
    </main>
  `,
  styles: [`
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .title {
      margin-left: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .spacer {
      flex: 1;
    }
    .subtitle {
      font-size: 14px;
      opacity: 0.8;
    }
    .content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }
  `]
})
export class AppComponent {}
