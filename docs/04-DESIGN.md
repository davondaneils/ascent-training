# 04 — Design System

## Direction

**Ascent should feel like:**

- Apple product restraint;
- WHOOP performance clarity;
- less visual density than either;
- premium but quiet;
- athletic without looking "gym bro";
- data-aware without looking like enterprise analytics.

Theme:

- light only in V1.

---

# Visual principles

1. **White space is functional.**
2. **Typography creates hierarchy before borders do.**
3. **Numbers are important. Make them large.**
4. **Active workout controls are oversized.**
5. **One accent color, used sparingly.**
6. **No gratuitous gradients.**
7. **No glassmorphism.**
8. **No neon fitness aesthetic.**
9. **No dashboard-card soup.**
10. **Motion shows state, not personality.**

---

# Suggested palette approach

Do not hardcode exact colors until visual QA.

Use semantic tokens.

Required semantic roles:

```text
background
surface
surface-subtle
text-primary
text-secondary
text-tertiary
border-subtle
accent
accent-foreground
success
warning
danger
focus
```

General direction:

- background: warm or neutral white;
- surface: near-white;
- subtle surface: light neutral gray;
- primary text: near-black;
- secondary: medium neutral gray;
- accent: restrained performance color;
- success: muted green;
- danger: restrained red.

Avoid pure black on pure white everywhere.

---

# Typography

Use a high-quality modern sans.

Preferred:

- system font stack / Geist / Inter-like implementation.

Hierarchy:

## Display / primary number
Used for:
- timers;
- major load;
- primary progress metric.

Should feel large and calm.

## H1
- screen title.

## H2
- exercise name / section heading.

## Body
- normal labels and explanations.

## Metadata
- week number;
- rest duration;
- previous performance labels.

Avoid uppercase everywhere.

Uppercase may be used sparingly for tiny metadata labels only.

---

# Spacing

Use a consistent 4px base scale.

Suggested tokens:

```text
4
8
12
16
20
24
32
40
48
64
```

Active workout should have generous vertical rhythm.

---

# Radius

Moderately rounded, not bubbly.

Suggested:

- cards: 16–20px;
- buttons: 14–18px;
- pills/chips: full;
- inputs: 12–16px.

---

# Borders and shadows

Prefer:

- subtle border;
- tonal surface separation;
- very restrained shadow.

Avoid floating-card shadows everywhere.

Primary cards may use:

- 1px neutral border;
- soft shadow only when useful.

---

# Buttons

## Primary

- large;
- full-width in workout mode;
- high contrast;
- obvious pressed state.

Examples:

- Start Workout
- Complete Set
- Continue
- Save

## Secondary

Examples:

- +30 sec
- Skip
- Overview

## Destructive

Rare.

Examples:

- discard workout;
- sign out.

Require confirmation for discarding workout progress.

---

# Inputs

Weight and reps inputs are not generic form fields.

They should be purpose-built controls.

Weight control:

```text
[-]   185 lb   [+]
```

Reps control:

```text
4   5   6
```

with manual numeric entry fallback.

Use large touch targets.

---

# Cards

Use cards only when they group a real task or concept.

Good:

- today's workout;
- today's cardio;
- one progress metric.

Bad:

- every label inside its own card.

---

# Active workout design

This screen gets priority over the rest of the app.

Key elements:

1. progress `1 / 7`;
2. exercise name;
3. movement visual;
4. prescription;
5. previous result;
6. current-set controls;
7. primary CTA.

Keep the number of simultaneously visible controls low.

The `Complete Set` button should sit where the thumb naturally reaches.

---

# Exercise media

Preferred treatment:

- neutral background;
- centered subject;
- consistent crop;
- no watermarks;
- no mismatched dark/light thumbnails;
- no cluttered gym backgrounds if avoidable.

Future preferred asset set:

- custom Ascent movement loops or consistent illustrated/3D demonstrations.

V1 may use placeholders if licensing/source consistency is unresolved.

---

# Charts

Charts should feel like Apple Health rather than finance software.

Rules:

- one line/bar chart at a time;
- minimal axes;
- no excessive gridlines;
- highlight current/recent value;
- tooltips on tap;
- show plain-language summary above chart.

Example:

```text
Bench Press
+10 lb over 8 weeks

[ simple line chart ]
```

---

# Iconography

Use one icon set only.

Recommended:

- Lucide.

Use icons as support, not decoration.

---

# Bottom navigation

Three items:

- Today
- Progress
- Plan

Keep labels visible.

Do not use floating center action buttons.

---

# Motion

Use Motion.

Examples:

- set completion checkmark;
- timer progress;
- active exercise transition;
- overview drawer;
- chart reveal.

Avoid:

- parallax;
- glowing trails;
- text scrambling;
- bouncy overshoot on every control;
- decorative entrance animations on every screen.

Respect `prefers-reduced-motion`.

---

# Reference sources

Use these selectively.

## Primary

- Refero Styles — system-level visual language inspiration
- AppShot Gallery — mobile app interaction references
- shadcn/ui — production primitives
- 21st.dev — occasional compatible patterns
- Motion Primitives — restrained interaction patterns
- Component Gallery — pattern comparison

## Secondary

- Minimal Gallery — taste / spacing / typography
- Magic UI — only if a specific restrained interaction is useful
- Aceternity — only if a specific restrained interaction is useful
- One Page Love touch/swipe — only if needed for gesture inspiration

## Generally unnecessary for V1

- navbar galleries
- footer galleries
- 404 galleries
- heavily decorative text-effect libraries

---

# Do not do

- dark mode in V1;
- giant hero sections;
- marketing landing page inside the product;
- gradients for every surface;
- neon green on black;
- fake glass cards;
- excessive corner radius;
- dense stat grids;
- gamification confetti;
- inspirational quotes;
- badges;
- streak anxiety;
- social proof;
- fake AI features.

Ascent should look like a product the user trusts to train with every day.
