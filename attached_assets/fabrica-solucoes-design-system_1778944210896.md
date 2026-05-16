# Fábrica de Soluções — Design System v1.0

> **Para IAs de codificação:** Este documento é a fonte única de verdade do Design System da Fábrica de Soluções. Toda interface, componente e decisão visual deve seguir rigorosamente estas especificações. O objetivo estético é **Apple meets Linear**: dark premium, sofisticado, com wow factor real.

---

## Índice

1. [Fundação Visual](#1-fundação-visual)
2. [Tokens de Cor](#2-tokens-de-cor)
3. [Sistema de Temas por Fase](#3-sistema-de-temas-por-fase)
4. [Tipografia](#4-tipografia)
5. [Espaçamento e Grid](#5-espaçamento-e-grid)
6. [Elevação e Glassmorphism](#6-elevação-e-glassmorphism)
7. [Componentes](#7-componentes)
8. [Sistema de Ícones](#8-sistema-de-ícones)
9. [Motion e Animação](#9-motion-e-animação)
10. [Padrões de Layout](#10-padrões-de-layout)
11. [Estados e Feedback](#11-estados-e-feedback)
12. [Adaptação de Stack](#12-adaptação-de-stack)

---

## 1. Fundação Visual

### Princípios

| Princípio | Descrição |
|-----------|-----------|
| **Dark Premium** | Fundo escuro como base universal. Nunca fundo branco puro. |
| **Tema por Fase** | Cada fase tem identidade cromática própria — o usuário *sente* a progressão. |
| **Glassmorphism Funcional** | Blur + borda translúcida apenas em elementos de destaque, nunca decorativo. |
| **Tipografia Bold** | Headlines grandes, peso pesado, criam impacto editorial. |
| **Animações com Propósito** | Transições revelam progressão, não decoram. |

### Identidade

- **Personalidade:** Sofisticado, focado, empoderador
- **Referências:** Linear.app · Raycast · Vercel Dashboard · Apple macOS Sequoia
- **Anti-referências:** Bootstrap, Material UI genérico, gradientes roxos em fundo branco

---

## 2. Tokens de Cor

### CSS Variables (cole em `:root`)

```css
:root {
  /* === BRAND BASE === */
  --color-brand-dark:      #2B0E6D;
  --color-brand-primary:   #7724FD;
  --color-brand-mid:       #5B1FD4;
  --color-brand-light:     #B2A5FF;
  --color-brand-glow:      rgba(119, 36, 253, 0.35);

  /* === BACKGROUNDS === */
  --bg-base:               #0D0B14;   /* fundo raiz — quase preto com tint roxo */
  --bg-surface:            #13101F;   /* superfície de cards e painéis */
  --bg-surface-raised:     #1C1830;   /* cards elevados, dropdowns */
  --bg-overlay:            rgba(19, 16, 31, 0.85); /* modais, sidesheets */

  /* === TEXTO === */
  --text-primary:          #F0EEFF;   /* texto principal sobre dark */
  --text-secondary:        #9B93C4;   /* labels, legendas */
  --text-tertiary:         #5C5480;   /* placeholders, disabled */
  --text-accent:           #B2A5FF;   /* links, highlights */
  --text-on-accent:        #FFFFFF;   /* texto sobre botões coloridos */

  /* === BORDAS === */
  --border-subtle:         rgba(178, 165, 255, 0.08);
  --border-default:        rgba(178, 165, 255, 0.15);
  --border-strong:         rgba(178, 165, 255, 0.30);
  --border-focus:          #7724FD;

  /* === ESTADOS === */
  --color-success:         #22D3A0;
  --color-success-bg:      rgba(34, 211, 160, 0.12);
  --color-warning:         #F5A623;
  --color-warning-bg:      rgba(245, 166, 35, 0.12);
  --color-error:           #FF4D6A;
  --color-error-bg:        rgba(255, 77, 106, 0.12);
  --color-info:            #38BDF8;
  --color-info-bg:         rgba(56, 189, 248, 0.12);

  /* === GRADIENTES BASE === */
  --gradient-brand:        linear-gradient(135deg, #2B0E6D 0%, #7724FD 100%);
  --gradient-surface:      linear-gradient(180deg, #1C1830 0%, #13101F 100%);
  --gradient-glow:         radial-gradient(ellipse at 50% 0%, rgba(119,36,253,0.25) 0%, transparent 70%);
}
```

### Tailwind Config (tailwind.config.js)

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          dark:    '#2B0E6D',
          primary: '#7724FD',
          mid:     '#5B1FD4',
          light:   '#B2A5FF',
        },
        bg: {
          base:    '#0D0B14',
          surface: '#13101F',
          raised:  '#1C1830',
        },
        text: {
          primary:   '#F0EEFF',
          secondary: '#9B93C4',
          tertiary:  '#5C5480',
          accent:    '#B2A5FF',
        }
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #2B0E6D 0%, #7724FD 100%)',
        'gradient-glow':  'radial-gradient(ellipse at 50% 0%, rgba(119,36,253,0.25) 0%, transparent 70%)',
      }
    }
  }
}
```

---

## 3. Sistema de Temas por Fase

Cada fase do pipeline possui identidade visual própria. A cor de acento, o gradiente de fundo e o glow são aplicados ao layout quando aquela fase está ativa.

### Mapa de Fases

| Fase | Nº | Acento Principal | Gradiente de Fundo | Glow |
|------|----|------------------|--------------------|------|
| **Ideia** | 1 | `#7724FD` Violeta | `#2B0E6D` → `#0D0B14` | `rgba(119, 36, 253, 0.30)` |
| **PRD** | 2 | `#2D9CDB` Azul Cobalto | `#0A2540` → `#0D0B14` | `rgba(45, 156, 219, 0.30)` |
| **Spec** | 3 | `#00C2A8` Teal | `#003D35` → `#0D0B14` | `rgba(0, 194, 168, 0.30)` |
| **Impl.** | 4 | `#F59E0B` Âmbar | `#2D1A00` → `#0D0B14` | `rgba(245, 158, 11, 0.30)` |
| **Teste** | 5 | `#EC4899` Rosa | `#3D0A25` → `#0D0B14` | `rgba(236, 72, 153, 0.30)` |
| **Deploy** | 6 | `#22D3A0` Verde Esmeralda | `#003D20` → `#0D0B14` | `rgba(34, 211, 160, 0.30)` |

### CSS Variables por Tema (injetadas via JS no `<body>` ou container)

```css
/* Exemplo: Fase 1 — Ideia */
[data-phase="1"] {
  --phase-accent:      #7724FD;
  --phase-accent-soft: rgba(119, 36, 253, 0.15);
  --phase-glow:        rgba(119, 36, 253, 0.30);
  --phase-gradient:    linear-gradient(160deg, #2B0E6D 0%, #0D0B14 60%);
  --phase-border:      rgba(119, 36, 253, 0.35);
}

/* Fase 2 — PRD */
[data-phase="2"] {
  --phase-accent:      #2D9CDB;
  --phase-accent-soft: rgba(45, 156, 219, 0.15);
  --phase-glow:        rgba(45, 156, 219, 0.30);
  --phase-gradient:    linear-gradient(160deg, #0A2540 0%, #0D0B14 60%);
  --phase-border:      rgba(45, 156, 219, 0.35);
}

/* Fase 3 — Spec */
[data-phase="3"] {
  --phase-accent:      #00C2A8;
  --phase-accent-soft: rgba(0, 194, 168, 0.15);
  --phase-glow:        rgba(0, 194, 168, 0.30);
  --phase-gradient:    linear-gradient(160deg, #003D35 0%, #0D0B14 60%);
  --phase-border:      rgba(0, 194, 168, 0.35);
}

/* Fase 4 — Impl. */
[data-phase="4"] {
  --phase-accent:      #F59E0B;
  --phase-accent-soft: rgba(245, 158, 11, 0.15);
  --phase-glow:        rgba(245, 158, 11, 0.30);
  --phase-gradient:    linear-gradient(160deg, #2D1A00 0%, #0D0B14 60%);
  --phase-border:      rgba(245, 158, 11, 0.35);
}

/* Fase 5 — Teste */
[data-phase="5"] {
  --phase-accent:      #EC4899;
  --phase-accent-soft: rgba(236, 72, 153, 0.15);
  --phase-glow:        rgba(236, 72, 153, 0.30);
  --phase-gradient:    linear-gradient(160deg, #3D0A25 0%, #0D0B14 60%);
  --phase-border:      rgba(236, 72, 153, 0.35);
}

/* Fase 6 — Deploy */
[data-phase="6"] {
  --phase-accent:      #22D3A0;
  --phase-accent-soft: rgba(34, 211, 160, 0.15);
  --phase-glow:        rgba(34, 211, 160, 0.30);
  --phase-gradient:    linear-gradient(160deg, #003D20 0%, #0D0B14 60%);
  --phase-border:      rgba(34, 211, 160, 0.35);
}
```

### Hook React para Troca de Tema

```jsx
// hooks/usePhaseTheme.js
import { useEffect } from 'react';

export function usePhaseTheme(phaseNumber) {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-phase', String(phaseNumber));
    return () => root.removeAttribute('data-phase');
  }, [phaseNumber]);
}

// Uso em qualquer página de fase:
// usePhaseTheme(1); // aplica tema da Fase 1
```

---

## 4. Tipografia

### Fontes

| Papel | Família | Peso | Fonte |
|-------|---------|------|-------|
| Display / Hero | **Sora** | 700, 800 | Google Fonts |
| Headings | **Sora** | 600 | Google Fonts |
| Body | **DM Sans** | 400, 500 | Google Fonts |
| Mono / Code | **JetBrains Mono** | 400, 500 | Google Fonts |
| Labels / Caps | **DM Sans** | 500 + `letter-spacing: 0.08em` | Google Fonts |

```html
<!-- Importar no <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Escala Tipográfica

```css
:root {
  /* Display */
  --text-display-2xl: clamp(3rem, 6vw, 5rem);      /* Hero headline */
  --text-display-xl:  clamp(2.25rem, 4vw, 3.5rem); /* Section hero */
  --text-display-lg:  clamp(1.75rem, 3vw, 2.5rem); /* Card headline */

  /* Headings */
  --text-h1: 2rem;       /* 32px */
  --text-h2: 1.5rem;     /* 24px */
  --text-h3: 1.25rem;    /* 20px */
  --text-h4: 1.125rem;   /* 18px */

  /* Body */
  --text-body-lg: 1.0625rem;  /* 17px */
  --text-body:    0.9375rem;  /* 15px */
  --text-body-sm: 0.875rem;   /* 14px */

  /* UI */
  --text-label:   0.8125rem;  /* 13px — uppercase + tracking */
  --text-caption: 0.75rem;    /* 12px */
  --text-micro:   0.6875rem;  /* 11px */
}
```

### Classes Utilitárias (Tailwind)

```js
// tailwind.config.js — extend fontSize
fontSize: {
  'display-2xl': ['clamp(3rem, 6vw, 5rem)',   { lineHeight: '1.05', fontWeight: '800' }],
  'display-xl':  ['clamp(2.25rem, 4vw, 3.5rem)', { lineHeight: '1.1',  fontWeight: '700' }],
  'display-lg':  ['clamp(1.75rem, 3vw, 2.5rem)', { lineHeight: '1.15', fontWeight: '700' }],
  'h1':          ['2rem',     { lineHeight: '1.2', fontWeight: '700' }],
  'h2':          ['1.5rem',   { lineHeight: '1.3', fontWeight: '600' }],
  'h3':          ['1.25rem',  { lineHeight: '1.4', fontWeight: '600' }],
  'label':       ['0.8125rem', { lineHeight: '1', fontWeight: '500', letterSpacing: '0.08em' }],
}
```

---

## 5. Espaçamento e Grid

### Escala de Espaçamento (base 4px)

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
}
```

### Border Radius

```css
:root {
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
  --radius-xl:   20px;
  --radius-2xl:  28px;
  --radius-full: 9999px;
}
```

### Grid do Layout

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (64px colapsada / 240px expandida)          │
│  ┌────────────┬────────────────────────────────────┐ │
│  │  NAV       │   CONTENT AREA                     │ │
│  │  240px     │   flex-1, max-width: 1200px        │ │
│  │  (ou 64px) │   padding: 32px                    │ │
│  └────────────┴────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 6. Elevação e Glassmorphism

### Níveis de Superfície

```css
/* Nível 0 — Fundo base */
.surface-0 {
  background: var(--bg-base);
}

/* Nível 1 — Cards padrão */
.surface-1 {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

/* Nível 2 — Cards elevados, painéis */
.surface-2 {
  background: var(--bg-surface-raised);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  box-shadow: 0 4px 24px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.04) inset;
}

/* Nível 3 — Glassmorphism (modais, hero cards, featured) */
.surface-glass {
  background: rgba(28, 24, 48, 0.60);
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-xl);
  box-shadow:
    0 8px 40px rgba(0,0,0,0.4),
    0 1px 0 rgba(255,255,255,0.06) inset,
    0 0 0 1px rgba(119,36,253,0.1) inset;
}

/* Nível 4 — Phase Hero Card (glassmorphism com glow de fase) */
.surface-phase-hero {
  background: rgba(28, 24, 48, 0.50);
  backdrop-filter: blur(32px) saturate(1.8);
  -webkit-backdrop-filter: blur(32px) saturate(1.8);
  border: 1px solid var(--phase-border);
  border-radius: var(--radius-2xl);
  box-shadow:
    0 0 80px var(--phase-glow),
    0 16px 48px rgba(0,0,0,0.5),
    0 1px 0 rgba(255,255,255,0.08) inset;
}
```

---

## 7. Componentes

### 7.1 Shell Layout

```jsx
// components/AppShell.jsx
function AppShell({ currentPhase, children }) {
  usePhaseTheme(currentPhase);

  return (
    <div
      className="app-shell"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-base)',
        // Glow radial no topo vindo da fase ativa
        backgroundImage: 'var(--gradient-glow), var(--phase-gradient)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 600px, 100% 100%',
      }}
    >
      <Sidebar currentPhase={currentPhase} />
      <main style={{ flex: 1, padding: 'var(--space-8)' }}>
        {children}
      </main>
    </div>
  );
}
```

---

### 7.2 Sidebar

**Especificação:**
- Largura expandida: `240px`
- Largura colapsada: `64px`
- Transição: `width 280ms cubic-bezier(0.4, 0, 0.2, 1)`
- Fundo: `rgba(13, 11, 20, 0.8)` + `backdrop-filter: blur(12px)`
- Borda direita: `1px solid var(--border-subtle)`

**Estados do NavItem:**

| Estado | Aparência |
|--------|-----------|
| Default | Ícone cinza + label `--text-secondary` |
| Hover | Background `var(--phase-accent-soft)`, ícone e texto `--text-primary` |
| Active | Background `var(--phase-accent-soft)`, borda esquerda `3px solid var(--phase-accent)`, texto `var(--phase-accent)` |
| Completed | Ícone com check overlay verde, texto `--text-secondary` |

```jsx
// components/NavItem.jsx
function NavItem({ phase, label, icon, isActive, isCompleted, isCollapsed }) {
  return (
    <div
      className={`nav-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        borderLeft: isActive ? '3px solid var(--phase-accent)' : '3px solid transparent',
        background: isActive ? 'var(--phase-accent-soft)' : 'transparent',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      <span className="nav-icon" style={{ flexShrink: 0, width: 20, height: 20 }}>
        {icon}
      </span>
      {!isCollapsed && (
        <span style={{
          color: isActive ? 'var(--phase-accent)' : 'var(--text-secondary)',
          fontFamily: 'DM Sans',
          fontSize: 'var(--text-body-sm)',
          fontWeight: isActive ? 500 : 400,
        }}>
          {label}
        </span>
      )}
    </div>
  );
}
```

---

### 7.3 PhaseStepBar (Pipeline)

Componente de progresso horizontal com 6 fases.

```jsx
// components/PhaseStepBar.jsx
const PHASES = [
  { id: 1, label: 'Ideia',   sub: 'Validação e potencial' },
  { id: 2, label: 'PRD',     sub: 'Definição de produto' },
  { id: 3, label: 'Spec',    sub: 'Arquitetura técnica' },
  { id: 4, label: 'Impl.',   sub: 'Plano de execução' },
  { id: 5, label: 'Teste',   sub: 'QA e validação' },
  { id: 6, label: 'Deploy',  sub: 'Lançamento real' },
];

const PHASE_COLORS = {
  1: '#7724FD', 2: '#2D9CDB', 3: '#00C2A8',
  4: '#F59E0B', 5: '#EC4899', 6: '#22D3A0',
};

function PhaseStepBar({ currentPhase }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {PHASES.map((phase, i) => (
        <React.Fragment key={phase.id}>
          {/* Step circle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: currentPhase >= phase.id
                ? PHASE_COLORS[phase.id]
                : 'var(--bg-surface-raised)',
              border: currentPhase === phase.id
                ? `2px solid ${PHASE_COLORS[phase.id]}`
                : '2px solid var(--border-subtle)',
              boxShadow: currentPhase === phase.id
                ? `0 0 16px ${PHASE_COLORS[phase.id]}66`
                : 'none',
              color: currentPhase >= phase.id ? '#fff' : 'var(--text-tertiary)',
              fontFamily: 'Sora',
              fontWeight: 700,
              fontSize: 14,
              transition: 'all 300ms ease',
            }}>
              {currentPhase > phase.id ? '✓' : phase.id}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'DM Sans',
                fontWeight: 500,
                fontSize: 13,
                color: currentPhase === phase.id
                  ? PHASE_COLORS[phase.id]
                  : 'var(--text-secondary)',
              }}>
                {phase.label}
              </div>
            </div>
          </div>

          {/* Connector line */}
          {i < PHASES.length - 1 && (
            <div style={{
              flex: 1,
              height: 2,
              marginBottom: 22,
              background: currentPhase > phase.id
                ? `linear-gradient(90deg, ${PHASE_COLORS[phase.id]}, ${PHASE_COLORS[phase.id + 1]})`
                : 'var(--border-subtle)',
              transition: 'background 400ms ease',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
```

---

### 7.4 Card (variantes)

```jsx
// Variante: StatsCard (métricas)
function StatsCard({ icon, label, value, subValue, action, actionLabel }) {
  return (
    <div className="surface-2" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span style={{ opacity: 0.7 }}>{icon}</span>
        <span style={{ fontFamily: 'DM Sans', fontSize: 'var(--text-body-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: 'Sora', fontSize: 'var(--text-h3)', fontWeight: 700, color: 'var(--text-primary)' }}>
        {value}
      </div>
      {subValue && (
        <div style={{ fontFamily: 'DM Sans', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          {subValue}
        </div>
      )}
      {action && (
        <button onClick={action} style={{
          alignSelf: 'flex-start',
          background: 'none',
          border: 'none',
          color: 'var(--phase-accent)',
          fontFamily: 'DM Sans',
          fontSize: 'var(--text-body-sm)',
          fontWeight: 500,
          cursor: 'pointer',
          padding: 0,
        }}>
          {actionLabel} →
        </button>
      )}
    </div>
  );
}

// Variante: PhaseHeroCard
function PhaseHeroCard({ phaseNumber, title, description, artifact3D }) {
  return (
    <div className="surface-phase-hero" style={{
      padding: 'var(--space-10)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 'var(--space-6)',
    }}>
      <div style={{ width: 120, height: 120 }}>{artifact3D}</div>
      <div>
        <h1 style={{
          fontFamily: 'Sora',
          fontSize: 'var(--text-display-xl)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
        }}>
          {title}
        </h1>
        <p style={{
          fontFamily: 'DM Sans',
          fontSize: 'var(--text-body-lg)',
          color: 'var(--text-secondary)',
          marginTop: 12,
        }}>
          {description}
        </p>
      </div>
    </div>
  );
}

// Variante: RecommendationCard (action card com ícone)
function RecommendationCard({ icon, title, description, ctaLabel, onCta }) {
  return (
    <div className="surface-1" style={{
      padding: 'var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
    }}>
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--phase-accent-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <h4 style={{
            fontFamily: 'Sora',
            fontWeight: 600,
            fontSize: 'var(--text-h4)',
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            {title}
          </h4>
          <p style={{
            fontFamily: 'DM Sans',
            fontSize: 'var(--text-body-sm)',
            color: 'var(--text-secondary)',
            marginTop: 4,
          }}>
            {description}
          </p>
        </div>
      </div>
      <Button variant="secondary" onClick={onCta}>{ctaLabel}</Button>
    </div>
  );
}
```

---

### 7.5 Botões

```jsx
// components/Button.jsx
const buttonStyles = {
  primary: {
    background: 'var(--phase-accent)',
    color: '#FFFFFF',
    border: 'none',
    boxShadow: '0 4px 20px var(--phase-glow)',
  },
  secondary: {
    background: 'var(--bg-surface-raised)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    boxShadow: 'none',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'none',
  },
  danger: {
    background: 'var(--color-error-bg)',
    color: 'var(--color-error)',
    border: '1px solid var(--color-error)',
    boxShadow: 'none',
  },
};

const sizeStyles = {
  sm:  { padding: '6px 14px',  fontSize: 13, borderRadius: 'var(--radius-sm)' },
  md:  { padding: '10px 20px', fontSize: 14, borderRadius: 'var(--radius-md)' },
  lg:  { padding: '14px 28px', fontSize: 15, borderRadius: 'var(--radius-lg)' },
  xl:  { padding: '18px 36px', fontSize: 16, borderRadius: 'var(--radius-xl)' },
};

function Button({ variant = 'primary', size = 'md', children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...buttonStyles[variant],
        ...sizeStyles[size],
        fontFamily: 'DM Sans',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 200ms ease',
        outline: 'none',
      }}
      onMouseEnter={e => {
        if (!disabled) e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {children}
    </button>
  );
}

// FloatingCTA (botão circular de ação primária)
function FloatingCTA({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: 'var(--phase-accent)',
        border: 'none',
        color: '#fff',
        fontFamily: 'DM Sans',
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
        boxShadow: '0 0 32px var(--phase-glow), 0 8px 24px rgba(0,0,0,0.4)',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        position: 'fixed',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateX(-50%) scale(1.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
      }}
    >
      {label}
    </button>
  );
}
```

---

### 7.6 Badge / StatusBadge

```jsx
function StatusBadge({ status }) {
  const config = {
    success:  { bg: 'var(--color-success-bg)',  color: 'var(--color-success)',  label: 'Concluído' },
    warning:  { bg: 'var(--color-warning-bg)',  color: 'var(--color-warning)',  label: 'Atenção' },
    error:    { bg: 'var(--color-error-bg)',    color: 'var(--color-error)',    label: 'Erro' },
    info:     { bg: 'var(--color-info-bg)',     color: 'var(--color-info)',     label: 'Info' },
    active:   { bg: 'var(--phase-accent-soft)', color: 'var(--phase-accent)',   label: 'Ativo' },
  };
  const c = config[status];
  return (
    <span style={{
      background: c.bg,
      color: c.color,
      padding: '3px 10px',
      borderRadius: 'var(--radius-full)',
      fontFamily: 'DM Sans',
      fontWeight: 500,
      fontSize: 12,
      letterSpacing: '0.02em',
    }}>
      {c.label}
    </span>
  );
}
```

---

### 7.7 Input / Form

```jsx
// Estilo base para todos os inputs
const inputBaseStyle = {
  width: '100%',
  padding: '10px 16px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontFamily: 'DM Sans',
  fontSize: 'var(--text-body-sm)',
  outline: 'none',
  transition: 'border-color 200ms ease, box-shadow 200ms ease',
};

// On focus:
// border-color: var(--phase-accent)
// box-shadow: 0 0 0 3px var(--phase-accent-soft)

// Textarea, Select seguem o mesmo padrão
```

---

### 7.8 TopBar

```jsx
function TopBar({ title, actions }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--space-8)',
      height: 56,
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(13, 11, 20, 0.7)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <span style={{
        fontFamily: 'Sora',
        fontWeight: 600,
        fontSize: 15,
        color: 'var(--text-primary)',
      }}>
        {title}
      </span>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        {actions}
      </div>
    </div>
  );
}
```

---

## 8. Sistema de Ícones

### Dois estilos canônicos

| Estilo | Uso | Tamanho |
|--------|-----|---------|
| **Line/Flat** | UI controls, ações inline, sidebar colapsada | 16px, 20px, 24px |
| **Solid Glassmorphism** | Ícone hero de fase, feature cards, onboarding | 64px, 96px, 120px |

### Regras de uso

- Ícones **Line/Flat** usam `currentColor` — herdam cor do pai
- Ícones **Solid** usam gradiente da fase ativa (`var(--phase-accent)` → tom mais claro)
- Nunca misturar estilos no mesmo nível hierárquico
- Sidebar expandida: ícone 20px + label
- Sidebar colapsada: ícone 20px centralizado com tooltip

### Categorias do sistema (280 ícones)

| Categoria | Qtd | Exemplos |
|-----------|-----|---------|
| UI Controls | 40 | search, close, filter, sort-asc, sort-desc, expand, collapse, refresh, copy, more-h, more-v, drag, pin |
| Navegação | 20 | home, back, forward, menu, arrow-up, arrow-down, arrow-left, arrow-right, external-link, anchor |
| Dispositivos | 30 | imac, macbook, mac-mini, ipad, iphone, server, hdd, router, monitor, keyboard, mouse |
| Arquivo / Storage | 30 | folder, folder-open, file, file-text, file-code, file-check, cloud, cloud-upload, cloud-download, trash |
| Sistema / Status | 25 | shield, shield-check, shield-x, lock, unlock, key, warning, error, check-circle, info-circle, bug |
| Fases / Pipeline | 15 | idea-bulb, prd-doc, spec-blueprint, impl-hammer, test-flask, deploy-rocket, phase-check, milestone |
| Usuário / Social | 25 | user, users, user-check, contact, id-card, team, avatar, role, invite, permission |
| Apps / Features | 40 | dashboard, analytics, settings, tools, grid, list, kanban, timeline, calendar, clock, bell, mail |
| Comunicação | 20 | chat, comment, reply, share, send, inbox, notification, mention, at-sign, phone |
| Data / Analytics | 25 | chart-bar, chart-line, chart-pie, trend-up, trend-down, table, filter, database, metrics, kpi |
| Ação / CTA | 15 | play, pause, stop, run, execute, review, analyze, generate, export, import |
| Misc | 15 | star, award, badge, tag, label, bookmark, link, qr-code, sparkle, zap |

### Ícone Glassmorphism — Template SVG

```jsx
// Estrutura base para ícones Solid Glassmorphism
function PhaseIcon({ phaseAccent, phaseAccentLight, children, size = 96 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <defs>
        <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={phaseAccentLight} stopOpacity="0.9" />
          <stop offset="100%" stopColor={phaseAccent} stopOpacity="1" />
        </linearGradient>
        <filter id="iconGlow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Fundo arredondado com gradiente */}
      <rect x="8" y="8" width="80" height="80" rx="22" fill="url(#iconGrad)" filter="url(#iconGlow)" />
      {/* Highlight superior (glassmorphism) */}
      <rect x="8" y="8" width="80" height="40" rx="22" fill="white" fillOpacity="0.08" />
      {/* Ícone centralizado (branco) */}
      <g transform="translate(48, 48)" fill="white">
        {children}
      </g>
    </svg>
  );
}
```

---

## 9. Motion e Animação

### Princípios

- **Propósito sobre decoração** — animar só o que comunica estado ou progressão
- **Duração curta** — máximo 400ms para transições de UI, 600ms para entradas de página
- **Easing suave** — `cubic-bezier(0.4, 0, 0.2, 1)` como padrão

### Tokens de Duração

```css
:root {
  --duration-instant:  80ms;
  --duration-fast:     150ms;
  --duration-normal:   250ms;
  --duration-slow:     350ms;
  --duration-phase:    500ms;   /* transição entre fases */
  --duration-enter:    600ms;   /* entrada de página */

  --ease-default:      cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring:       cubic-bezier(0.34, 1.56, 0.64, 1);  /* bounce suave */
  --ease-out:          cubic-bezier(0, 0, 0.2, 1);
  --ease-in:           cubic-bezier(0.4, 0, 1, 1);
}
```

### Keyframes Padrão

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 20px var(--phase-glow); }
  50%       { box-shadow: 0 0 40px var(--phase-glow), 0 0 80px var(--phase-glow); }
}

@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position:  200% 0; }
}
```

### Padrão de Entrada de Página

```jsx
// Staggered reveal — cards aparecem em cascata
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } }
};

const itemVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }
};
// Usar com framer-motion: <motion.div variants={itemVariants}>
```

### Transição de Fase

```js
// Ao trocar de fase: fade out background → troca data-phase → fade in
async function transitionToPhase(phaseNumber, setPhase) {
  document.documentElement.style.transition =
    `background 500ms ${CSS_EASE_DEFAULT}, opacity 200ms ease`;
  document.documentElement.style.opacity = '0.7';

  await new Promise(r => setTimeout(r, 200));
  setPhase(phaseNumber);

  document.documentElement.style.opacity = '1';
}
```

### Skeleton Loading

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-surface) 25%,
    var(--bg-surface-raised) 50%,
    var(--bg-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}
```

---

## 10. Padrões de Layout

### Layout 1 — Phase Landing (tela inicial de cada fase)

```
┌─────────────────────────────────────────────────────────┐
│  [Sidebar]  │  [TopBar: nome da fase]                   │
│             │  ─────────────────────────────────────    │
│             │                                           │
│             │     [PhaseHeroCard — centro]              │
│             │     [Ícone glassmorphism 3D]              │
│             │     [Título + Descrição]                  │
│             │                                           │
│             │     [FloatingCTA: "Gerar Artefatos"]      │
└─────────────┴───────────────────────────────────────────┘
```

### Layout 2 — Dashboard (Assistente / Overview)

```
┌─────────────────────────────────────────────────────────┐
│  [Sidebar]  │  [TopBar]                                 │
│             │  ─────────────────────────────────────    │
│             │  [StatusHeroCard — 2/3 largura]           │
│             │                                           │
│             │  [RecommendationCard] [RecommendationCard]│
│             │  [RecommendationCard] [RecommendationCard]│
└─────────────┴───────────────────────────────────────────┘
```

### Layout 3 — Artefatos (lista de resultados)

```
┌─────────────────────────────────────────────────────────┐
│  [Sidebar]  │  [TopBar + actions]                       │
│             │  [PhaseStepBar]                           │
│             │  ─────────────────────────────────────    │
│             │  [StatsRow: 3–4 métricas]                 │
│             │                                           │
│             │  [ArtifactList — cards em grid 2col]      │
│             │  [ArtifactCard] [ArtifactCard]            │
│             │  [ArtifactCard] [ArtifactCard]            │
└─────────────┴───────────────────────────────────────────┘
```

---

## 11. Estados e Feedback

### Empty State

```jsx
function EmptyState({ icon, title, description, ctaLabel, onCta }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-16)',
      gap: 'var(--space-4)',
      textAlign: 'center',
    }}>
      <div style={{ opacity: 0.4, fontSize: 48 }}>{icon}</div>
      <h3 style={{
        fontFamily: 'Sora', fontWeight: 600,
        color: 'var(--text-primary)', fontSize: 'var(--text-h3)',
      }}>{title}</h3>
      <p style={{
        fontFamily: 'DM Sans', color: 'var(--text-secondary)',
        fontSize: 'var(--text-body-sm)', maxWidth: 360,
      }}>{description}</p>
      {ctaLabel && <Button variant="primary" onClick={onCta}>{ctaLabel}</Button>}
    </div>
  );
}
```

### Toast / Notificação

```jsx
// Posição: bottom-right, empilhamento vertical de baixo para cima
// Duração padrão: 4s com progress bar

const toastStyles = {
  success: { accent: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  warning: { accent: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  error:   { accent: 'var(--color-error)',   bg: 'var(--color-error-bg)' },
  info:    { accent: 'var(--color-info)',    bg: 'var(--color-info-bg)' },
};
```

---

## 12. Adaptação de Stack

O DS foi documentado em React (JSX + CSS Variables). Para outros stacks:

### Vue 3

- Substituir `function Component()` por `<script setup>` + `<template>`
- `style={{ ... }}` → `:style="{ ... }"`
- `useEffect` → `onMounted` / `watch`
- CSS Variables funcionam identicamente

### HTML + CSS Puro

- Remover JSX, aplicar classes e estilos diretamente
- `data-phase="N"` no elemento pai continua funcionando
- CSS Variables no `:root` são universais

### Tailwind Obrigatório?

Não. O DS usa **CSS Variables como fonte primária**. Tailwind é opcional para utilities (`flex`, `gap`, `p-*`). Todos os valores de design estão nas variáveis — qualquer framework CSS consegue consumi-las.

---

## Apêndice — Checklist para IA de Codificação

Antes de gerar qualquer interface nova, confirme:

- [ ] Fundo base usa `var(--bg-base)` ou `var(--bg-surface)`
- [ ] Fase ativa tem `data-phase="N"` no container principal
- [ ] Tipografia usa **Sora** (headings) + **DM Sans** (body)
- [ ] Botão primário usa `var(--phase-accent)` como background
- [ ] Cards usam `.surface-1`, `.surface-2` ou `.surface-glass`
- [ ] Inputs focados têm `border-color: var(--phase-accent)` + glow
- [ ] Transições usam `var(--duration-normal)` e `var(--ease-default)`
- [ ] Ícones hero da fase são **Solid Glassmorphism**
- [ ] Ícones de UI são **Line/Flat** com `currentColor`
- [ ] Nenhum fundo branco puro — mínimo `var(--bg-surface)`

---

*Design System gerado em 16/05/2026 — Fábrica de Soluções v1.0*
*Base visual: CleanMyMac (temas por módulo) × Linear.app (dark premium SaaS) × Apple (glassmorphism e elevação)*
