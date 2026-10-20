# Spec — 4 thèmes et 12 couleurs d'accent

> Statut : validée, à implémenter sur la branche `claude/dazzling-cori-up5ydj`.
> Maquettes et analyse de contraste : https://claude.ai/artifact/HkCJt6yPSt4NXBzx8UPT4e

## Objectif

Deux réglages d'apparence indépendants, posés sur l'élément `<html>` :

| Réglage | Mécanisme                     | Valeurs                                                                                                                              |
| ------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Thème   | une classe (aucune = `light`) | `light`, `sand`, `dark`, `deep-blue`                                                                                                 |
| Accent  | attribut `data-accent`        | `blue` (défaut, pas d'attribut), `indigo`, `violet`, `purple`, `rose`, `red`, `orange`, `amber`, `green`, `teal`, `cyan`, `graphite` |

Exemple : `<html class="sand" data-accent="teal">`. 4 × 12 = 48 combinaisons, toutes au niveau WCAG AA (vérifié, voir § 1.6).

## Décisions prises

- `dark` devient le thème **noir/gris neutre adouci** (pas de noir pur). L'ancien `dark` bleu nuit est renommé `deep-blue`, valeurs identiques.
- La classe `.oled` ajoutée dans le premier commit de la branche **disparaît** (jamais publiée).
- Les 12 accents sont gardés. Rouge, Orange, Ambre et Vert sont **à la fin** de toute liste affichée, car ils ressemblent aux couleurs de statut (error / warning / success).
- Correctif de contraste inclus : les **liens et libellés actifs** passent de `text-brand-500` à `text-brand-600` en thème clair.
- Hors périmètre : le texte « muted » existant (`--color-text-muted`, `text-gray-400` en clair, ~2,5:1) sera traité dans une PR séparée. Ne pas le modifier ici.
- Périmètre : `packages/theme`, Storybook, `packages/react`, `packages/charts`.
- Changement cassant assumé (packages en 0.0.x) : un consommateur qui pose `.dark` obtient désormais le noir/gris.

## État actuel de la branche

Le commit `feat(theme): add sand (beige light) and oled (black/gray dark) themes` a déjà :

- ajouté `.sand` (valeurs définitives, à garder telles quelles) et `.oled` (à supprimer) dans `packages/theme/css/css-vars.css` ;
- étendu la variante Tailwind `dark:` à `.oled` dans `packages/theme/css/tailwind-tokens.css` ;
- ajouté `sand` et `oled` au sélecteur de thème de Storybook.

Cette spec remplace ce travail là où elle diverge.

---

## 1. `packages/theme`

### 1.1 Principe

Les composants utilisent surtout les classes Tailwind de la palette (`bg-white`, `text-gray-500`, `dark:bg-gray-900`, `bg-brand-500`…). Tailwind 4 les compile en `var(--color-…)`. Un thème ou un accent **redéfinit ces variables** sur `<html>` ; aucun composant n'a besoin de classes par thème.

Les règles de thème et d'accent restent **hors de tout `@layer`** dans `css-vars.css`, pour primer sur le bloc `@theme` de Tailwind (émis dans `@layer theme`).

### 1.2 Thèmes — `css/css-vars.css`

Mettre à jour le commentaire d'en-tête (4 thèmes + accents, une classe + un attribut sur `<html>`).

**`:root` (light)** : inchangé, sauf `--color-accent: var(--color-brand-500);` (au lieu de `#465fff`).

**`.sand`** : garder le bloc existant, sauf `--color-accent` à **supprimer** (hérité de `:root`).

**`.dark`** (nouveau, noir/gris neutre) — remplace l'ancien `.dark` et `.oled` :

```css
.dark {
  color-scheme: dark;

  --color-bg-base: #0a0a0a;
  --color-bg-panel: #141414;
  --color-bg-elevated: #242424;

  --color-border: #3d3d3d;

  --color-text-base: #e5e5e5;
  --color-text-primary: #fff;
  --color-text-secondary: #a3a3a3;
  --color-text-muted: #8f8f8f;

  /* Neutral gray scale, softened near-black (no pure #000). */
  --color-gray-50: #fafafa;
  --color-gray-100: #f5f5f5;
  --color-gray-200: #e5e5e5;
  --color-gray-300: #d4d4d4;
  --color-gray-400: #a3a3a3;
  --color-gray-500: #8f8f8f;
  --color-gray-600: #5c5c5c;
  --color-gray-700: #3d3d3d;
  --color-gray-800: #242424;
  --color-gray-900: #141414;
  --color-gray-950: #0a0a0a;
  --color-gray-dark: #141414;
}
```

**`.deep-blue`** : exactement les valeurs de l'**ancien** `.dark`, sans surcharge de gris (il utilise la palette gray par défaut de Tailwind) :

```css
.deep-blue {
  color-scheme: dark;

  --color-bg-base: #0c111d;
  --color-bg-panel: #1a2231;
  --color-bg-elevated: #1d2939;

  --color-border: #344054;

  --color-text-base: #e4e7ec;
  --color-text-primary: #fff;
  --color-text-secondary: #98a2b3;
  --color-text-muted: #667085;
}
```

Aucun bloc de thème ne définit `--color-accent` : seul `:root` le fait, via `var(--color-brand-500)`.

### 1.3 Variante `dark:` — `css/tailwind-tokens.css`

```css
@custom-variant dark (&:is(.dark, .dark *, .deep-blue, .deep-blue *));
```

Mettre à jour les commentaires associés (`.dark` / `.deep-blue`).

### 1.4 Accents — `css/css-vars.css`

Ajouter une section après les thèmes. Le bleu reste la valeur du bloc `@theme` (aucune règle). Pour chaque autre accent, un bloc qui redéfinit les 12 teintes :

```css
[data-accent='indigo'] {
  --color-brand-25: #f4f6fe;
  /* … 50 → 950 … */
}
```

Valeurs (de 25 à 950, dans l'ordre 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950) :

| Accent     | Libellé  | 25        | 50        | 100       | 200       | 300       | 400       | 500       | 600       | 700       | 800       | 900       | 950       |
| ---------- | -------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- |
| `blue`     | Bleu     | `#f2f7ff` | `#ecf3ff` | `#dde9ff` | `#c2d6ff` | `#9cb9ff` | `#7592ff` | `#465fff` | `#3641f5` | `#2a31d8` | `#252dae` | `#262e89` | `#161950` |
| `indigo`   | Indigo   | `#f4f6fe` | `#eff2fe` | `#e2e7ff` | `#c9d3ff` | `#a7b5ff` | `#7f8fff` | `#5963e9` | `#4a4fd3` | `#3c3bbf` | `#2f25ab` | `#24257a` | `#160b63` |
| `violet`   | Violet   | `#f7f5ff` | `#f3f0fe` | `#eae4ff` | `#d8ceff` | `#c0abff` | `#a57eff` | `#8745f1` | `#752cdb` | `#6508c6` | `#5200a4` | `#3f097e` | `#2b005b` |
| `purple`   | Pourpre  | `#fcf3ff` | `#fbedff` | `#f7dfff` | `#f0c2ff` | `#e696ff` | `#d55bf8` | `#ad2ecf` | `#990aba` | `#81019e` | `#690181` | `#520066` | `#380046` |
| `rose`     | Rose     | `#fff3f6` | `#ffeef1` | `#ffdfe6` | `#ffc3d2` | `#ff96b4` | `#ff4e90` | `#d4166d` | `#b8005c` | `#9b004c` | `#7f013d` | `#64002f` | `#45001e` |
| `teal`     | Teal     | `#defffa` | `#d2fdf6` | `#c8f3ec` | `#99e7dc` | `#31d5c6` | `#02b3a5` | `#038378` | `#006f66` | `#015c54` | `#024a43` | `#003833` | `#002723` |
| `cyan`     | Cyan     | `#ecf9ff` | `#e1f7ff` | `#c8f0ff` | `#96e3fe` | `#25cefb` | `#01abd3` | `#017f9d` | `#016b84` | `#01596e` | `#014759` | `#003645` | `#002631` |
| `graphite` | Graphite | `#f5f7fb` | `#f0f3f7` | `#e6e8ec` | `#d0d6e2` | `#b5bbc7` | `#959ba6` | `#707580` | `#5d626d` | `#4c515c` | `#3c414b` | `#2e3138` | `#1f2228` |
| `red`      | Rouge    | `#fff4f3` | `#ffeeec` | `#ffe0dd` | `#ffc6c0` | `#ff9b94` | `#ff5a57` | `#db192a` | `#be021e` | `#a00118` | `#830011` | `#67000b` | `#470005` |
| `orange`   | Orange   | `#fff4f0` | `#ffefe8` | `#ffe1d5` | `#ffc8b0` | `#ff9f73` | `#f66a15` | `#c04f01` | `#a44201` | `#8a3600` | `#712b00` | `#592000` | `#3d1300` |
| `amber`    | Ambre    | `#fff5ea` | `#fff0e0` | `#ffe3c5` | `#ffcb8f` | `#ffa408` | `#d48700` | `#a46800` | `#8a5601` | `#734701` | `#5d3900` | `#482b00` | `#321c00` |
| `green`    | Vert     | `#e5ffe9` | `#d7ffde` | `#cdf4d4` | `#a5e9b2` | `#5ad87e` | `#32b75e` | `#02863c` | `#027232` | `#015e28` | `#014b1f` | `#003915` | `#00280d` |

L'ordre du tableau est l'ordre d'affichage (les 4 accents proches des statuts à la fin).

### 1.5 Halo de focus — `css/tailwind-tokens.css`

Remplacer le bleu codé en dur :

```css
--shadow-focus-ring: 0px 0px 0px 4px color-mix(in srgb, var(--color-brand-500) 12%, transparent);
```

### 1.6 Garde-fou de contraste — `packages/theme/scripts/check-contrast.mjs`

Script Node sans dépendance, branché sur le script `test` de `packages/theme/package.json` (remplace l'`echo`). Il lit `css/css-vars.css` et `css/tailwind-tokens.css`, convertit les couleurs (hex et `oklch()` → sRGB), calcule les ratios WCAG 2.x et **échoue** si un seuil n'est pas atteint. Les gris Tailwind par défaut (utilisés par `light` et `deep-blue`) sont codés en dur dans le script :

| Token Tailwind 4.3 | Valeur                       |
| ------------------ | ---------------------------- |
| gray-50            | `oklch(98.5% 0.002 247.839)` |
| gray-100           | `oklch(96.7% 0.003 264.542)` |
| gray-200           | `oklch(92.8% 0.006 264.531)` |
| gray-300           | `oklch(87.2% 0.01 258.338)`  |
| gray-400           | `oklch(70.7% 0.022 261.325)` |
| gray-500           | `oklch(55.1% 0.027 264.364)` |
| gray-600           | `oklch(44.6% 0.03 256.802)`  |
| gray-700           | `oklch(37.3% 0.034 259.733)` |
| gray-800           | `oklch(27.8% 0.033 256.848)` |
| gray-900           | `oklch(21% 0.034 264.665)`   |
| gray-950           | `oklch(13% 0.028 261.692)`   |

Surfaces de référence : clair = page `--color-bg-base`, carte `white`, subtil `gray-100` ; sombre = page `--color-bg-base`, carte `gray-900`, relief `gray-800`.

Seuils vérifiés (≥ 4,5 sauf mention) :

- Pour chaque thème : titres et texte courant (clair : `gray-900`, `gray-700`, `gray-600`, `gray-500` ; sombre : `white`, `gray-200`, `gray-300`, `gray-400`) sur les 3 surfaces. Exception connue : `light` `gray-500` sur `gray-100` = 4,39, à tolérer (≥ 4,3) car hors périmètre.
- `dark` uniquement : `gray-500` / `--color-text-muted` sur les 3 surfaces (attendu ≥ 4,8).
- Pour chaque accent × thème clair : `brand-600` sur les 3 surfaces et sur `brand-50`.
- Pour chaque accent × thème sombre : `brand-400` sur les 3 surfaces.
- Pour chaque accent : texte blanc (`--color-white` du thème, crème `oklch(99.3% 0.008 85)` en `sand`) sur `brand-500`.
- Structure `dark` (seuils non-WCAG, pour éviter les surfaces qui se confondent) : carte ↔ relief ≥ 1,15 ; `gray-700` sur carte ≥ 1,6.

Ne **pas** vérifier `--color-text-muted` ni `gray-400` en clair, ni `muted` en `deep-blue` (dette connue, PR séparée).

Valeurs de référence attendues (pire cas) : blanc sur `brand-500` entre 4,61 et 5,16 ; `brand-600` sur Sand subtil ≥ 5,21 ; `brand-400` sur relief `deep-blue` ≥ 4,67 ; `dark` : `gray-500` sur relief 4,80, carte ↔ relief 1,19, `gray-700` sur carte 1,70.

Le script affiche un tableau lisible et sort en code 1 au premier échec, avec la paire fautive.

### 1.7 Documentation — `packages/theme/README.md`

Ajouter une section « Themes & accents » : la liste des 4 thèmes et 12 accents, l'exemple `<html class="sand" data-accent="teal">`, la règle « un seul thème à la fois », et la mise en garde sur Rouge / Orange / Ambre / Vert (ressemblent aux statuts).

---

## 2. Storybook — `apps/storybook`

- `.storybook/preview.tsx` :
  - `withThemeByClassName({ themes: { light: '', sand: 'sand', dark: 'dark', 'deep-blue': 'deep-blue' }, defaultTheme: 'deep-blue', parentSelector: 'html' })`. `deep-blue` par défaut, pour garder l'apparence actuelle et rester cohérent avec `cosmosDarkTheme` (chrome des docs en bleu nuit).
  - Ajouter un réglage global `accent` dans la barre d'outils : `globalTypes.accent` (icône `paintbrush`, `dynamicTitle: true`, les 12 accents dans l'ordre du § 1.4) + `initialGlobals: { accent: 'blue' }`, et un décorateur qui pose `document.documentElement.dataset.accent` (retire l'attribut pour `blue`). Ne pas utiliser un second décorateur d'`@storybook/addon-themes` : il partagerait le global `theme`.
- `.storybook/preview.css` : mettre à jour le commentaire (`:root + .sand + .dark + .deep-blue + [data-accent]`).
- `stories/Welcome.stories.tsx` : la phrase « Dark mode toggles automatically via the `data-theme` attribute… » est fausse. La remplacer par l'explication classe de thème + `data-accent`.
- Ajouter une story `Foundations/Appearance` qui monte `AppearanceSettings` (§ 3.2) et applique le choix au document via `applyAppearance`, pour tester toutes les combinaisons depuis une page.

## 3. `packages/react`

### 3.1 Données et utilitaire — `src/settings/appearance.ts` (exporté depuis `src/settings/index.ts`)

```ts
export type CosmosTheme = 'light' | 'sand' | 'dark' | 'deep-blue';
export type CosmosAccent =
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'rose'
  | 'teal'
  | 'cyan'
  | 'graphite'
  | 'red'
  | 'orange'
  | 'amber'
  | 'green';
```

- `COSMOS_THEMES` : tableau de `PaletteMeta & { id: CosmosTheme; dark: boolean }` (type existant dans `PaletteCard.tsx`), libellés anglais (`Light`, `Sand`, `Dark`, `Deep Blue`), `preview` :
  - light : `bg #f9fafb`, `surface #ffffff`, `border #e5e7eb`
  - sand : `bg #f9f5eb`, `surface #fffcf7`, `border #e7dfd0`
  - dark : `bg #0a0a0a`, `surface #141414`, `border #3d3d3d`
  - deep-blue : `bg #0c111d`, `surface #101828`, `border #344054`
- `COSMOS_ACCENTS` : tableau de `AccentColor & { id: CosmosAccent }` (type existant dans `AccentPicker.tsx`), `hex` = le `brand-500` du § 1.4, libellés anglais (`Blue`, `Indigo`, `Violet`, `Purple`, `Rose`, `Teal`, `Cyan`, `Graphite`, `Red`, `Orange`, `Amber`, `Green`), **dans l'ordre du § 1.4**.
- `applyAppearance({ theme, accent }, root = document.documentElement)` : retire toutes les classes de thème connues, ajoute celle de `theme` (aucune pour `light`), pose `data-accent` (retire l'attribut pour `blue`). Sans effet si `document` n'existe pas (SSR).
- `isDarkTheme(theme)` : `true` pour `dark` et `deep-blue`.

### 3.2 Composant `AppearanceSettings` — `src/settings/AppearanceSettings.tsx`

Compose les composants existants `PalettePicker` (thèmes) et `AccentPicker` (accents) :

- props : `theme`, `accent`, `onThemeChange(theme)`, `onAccentChange(accent)`, `themeLabel` (défaut `'Theme'`), `accentLabel` (défaut `'Accent color'`), `className` ; `themes` / `accents` optionnels (défaut `COSMOS_THEMES` / `COSMOS_ACCENTS`) pour restreindre la liste.
- Chaque groupe a un titre visible relié au groupe (`aria-labelledby`).
- Story `AppearanceSettings.stories.tsx` avec tests `play` (au style des stories existantes) : cliquer sur `Sand` appelle `onThemeChange('sand')`, cliquer sur `Teal` appelle `onAccentChange('teal')`.

### 3.3 `ThemeToggleTri` — changement cassant

- `ThemeMode` devient `'light' | 'dark' | 'deep-blue'` ; cycle `light → dark → deep-blue → light`.
- Icônes : `light` Sun, `dark` Moon, `deep-blue` MoonStar.
- `oledLabel` est remplacé par `deepBlueLabel` (défaut `'Switch to deep blue mode'`).
- Mettre à jour `ThemeToggleTri.stories.tsx` (stories et tests `Oled…` → `DeepBlue…`) et la doc de `DocPage.stories.tsx` qui mentionne « light + dark + OLED variants ».
- `ThemeToggle` (booléen `isDark`) et la prop `theme` de `Navbar` ne changent pas.

### 3.4 Liens en `brand-600` sur fond clair

Dans `packages/react/src` (hors stories), les **textes** en `text-brand-500` (liens, libellés et onglets actifs, ~19 occurrences) passent en `text-brand-600`. Garder la variante sombre existante (`dark:text-brand-400`) ; si elle manque, l'ajouter. Ne pas toucher `bg-brand-500`, `border-brand-500`, `ring-…`, ni les icônes décoratives. Raison : `brand-500` en texte tombe à 4,15–4,44 sur Sand ; `brand-600` tient ≥ 5,2 avec les 12 accents.

## 4. `packages/charts` — `src/theme.ts`

- `detectDark` : vrai si `<html>` a la classe `dark` **ou** `deep-blue` (sinon les graphiques restent clairs en `deep-blue`).
- Ajouter `readCssVar(name, fallback)` (lecture via `getComputedStyle(document.documentElement)`, `fallback` si vide ou SSR).
- `useDarkMode` → observer aussi `data-accent` (`attributeFilter: ['class', 'data-accent']`), ou un hook `useAppearance` qui expose `dark` et une clé de rafraîchissement.
- `useChartTheme` : `brand` = `--color-brand-500` (fallback `COSMOS_BRAND`) ; `palette` = `[brand, ...COSMOS_PALETTE.slice(1)]` ; grille = `--color-gray-800` en sombre / `--color-gray-200` en clair ; libellés d'axe = `--color-gray-400` en sombre / `--color-gray-500` en clair (fallbacks = les valeurs actuelles).
- Garder l'export `COSMOS_BRAND` (doc : valeur par défaut, préférer `useChartTheme().brand`).

## 5. Commits

- Commits conventionnels par package, par exemple `feat(theme)!: …`, `feat(react)!: …`, `feat(charts): …`, `docs(storybook): …`.
- Pied de commit `BREAKING CHANGE:` pour `theme` (`.dark` devient neutre, l'ancien est `.deep-blue`) et `react` (`ThemeToggleTri` : `oled` → `deep-blue`, `oledLabel` → `deepBlueLabel`).
- Pousser sur `claude/dazzling-cori-up5ydj`. Pas de PR sans demande.

## 6. Validation avant push

1. `pnpm lint`, `pnpm format:check`, `pnpm typecheck`.
2. `pnpm --filter @sckyzo/cosmos-theme test` (script de contraste du § 1.6) : doit passer.
3. `pnpm test` (stories + tests `play` + a11y en mode `error`).
4. `pnpm build`.
5. Contrôle visuel dans Storybook : les 4 thèmes avec au moins `blue`, `teal` et `red`, sur `Pages/Dashboard`, un formulaire (halo de focus) et un graphique (couleur suit l'accent, graphique sombre en `deep-blue`).

## Hors périmètre (PR séparées)

- Texte « muted » trop clair dans les thèmes existants.
- `Toast` (`theme="system"` de Sonner) suit `prefers-color-scheme`, pas la classe de thème.
