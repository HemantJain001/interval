<!-- SEED: re-run $impeccable document once there's code to capture the actual tokens and components. -->
---
name: Interval 2.0
description: Spaced repetition revision tracker
---

# Design System: Interval 2.0

## 1. Overview

**Creative North Star: "The Kinetic Library"**

The visual design system of Interval 2.0 is built on the metaphor of a living, breathing archive of knowledge. Rather than presenting a static log, information shifts and presents itself dynamically based on active review states and memory cycles. The interface blends a classic editorial feel (achieved via serif headings) with modern, high-contrast, tech-forward accents and interactive choreography. 

The visual layout prioritizes structured grids and clean boundaries, rejecting the heavy glassmorphism and floaty, oversized shadows popular in standard SaaS templates. Depth is conveyed strictly through clean tonal changes, precise borders, and animated transitions that map to the user's study flow.

**Key Characteristics:**
- High information clarity with a distinct classic-meets-tech typographical contrast.
- Vibrant, deliberate color roles used to highlight review statuses (low/medium/high urgency).
- Orchestrated animations that draw attention to active reviews and record entry events.

## 2. Colors

Colors in the Kinetic Library are deliberate, vibrant, and highly functional. We use a full palette where every color role has an active purpose in indicating user memory retention and task urgency.

### Primary
- **Stripe Indigo** (#6366f1): The main action indicator, branding highlight, and primary focus color.

### Secondary
- **Supabase Green** (#10b981): Used strictly to indicate master level, successful review streaks, and online cloud sync status.

### Tertiary
- **Vercel Amber** (#f59e0b): Indicates medium difficulty or items requiring attention soon.
- **Crimson Alert** (#ef4444): Indicates high difficulty, overdue review cards, and critical sync errors.

### Neutral
- **Slate Canvas** (#0f172a / #ffffff): Primary body text and deep slate layout headers.
- **Warm Ink** (#f4f4f3 / #efefef): Muted borders and surface colors.

### Named Rules
**The Active Contrast Rule.** Saturated color roles must never be used for background decoration. Accent colors like Stripe Indigo and Crimson Alert are reserved strictly for call-to-actions, status chips, and urgent alerts.

## 3. Typography

**Display Font:** Playfair Display (or editorial Serif fallback)
**Body Font:** Inter (or modern Sans fallback)
**Label/Mono Font:** Fira Code (or monospace fallback)

**Character:** A sharp, sophisticated pairing. Bold, elegant serif headings establish a scholarly tone, while clean, highly readable sans-serif body text ensures rapid information scanning.

### Hierarchy
- **Display** (Bold, 2.5rem, 1.2): Main page headers and hero review counters.
- **Headline** (Semi-Bold, 1.8rem, 1.3): Major section dividers.
- **Title** (Medium, 1.3rem, 1.4): Card headings and item labels.
- **Body** (Regular, 1rem, 1.5): Study notes, card descriptions, and general text.
- **Label** (Medium, 0.8rem, 0.05em letter-spacing, uppercase): Metadata chips and table headers.

## 4. Elevation

The Kinetic Library is flat-by-default, emphasizing precise layout lines over depth cues. We do not use floating cards, heavy glassmorphism overlays, or large ambient shadows.

### Named Rules
**The Border-As-Structure Rule.** Depth is conveyed using solid 1px borders (#efefef) and tonal background variations, never with box shadows. The only exception is floating modal dialogs, which are permitted to have a soft, tight shadow to separate them from the active canvas.

## 5. Components

Components are currently represented as visual blueprints to be resolved during implementation.

### Buttons
- **Shape:** Soft rounded corners (6px)
- **Primary:** Stripe Indigo background with Slate Canvas white text.
- **Hover:** Slight background brightening with an active translate-Y transition.

### Cards / Containers
- **Corner Style:** Rounded (8px)
- **Background:** White canvas surface.
- **Border:** 1px solid Warm Ink border.
- **Shadow Strategy:** Flat (no shadows).

## 6. Do's and Don'ts

### Do:
- **Do** use strict 1px solid borders to delineate cards, lists, and sections.
- **Do** pair bold serif display headings with geometric sans-serif body text to maintain the "Kinetic Library" editorial feel.
- **Do** align color usage to the primary memory retention status (Green = Mastered, Amber = Intermediate, Crimson = Overdue).

### Don't:
- **Don't** use heavy glassmorphism backgrounds or cards with large, fuzzy box-shadows.
- **Don't** use neon gradients or multi-colored backgrounds on cards.
- **Don't** default to plain browser fonts or unstyled buttons.
