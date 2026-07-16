# story-section Specification

## Purpose
TBD - created by archiving change story-and-proof. Update Purpose after archive.
## Requirements
### Requirement: Story narrative with timeline
A `#story` section SHALL tell the verified growth narrative (2025 founding → viral reel →
Kanchrapara expansion → lab certification) rendered from stats.timeline, with SplitText masked
line reveals for the headline (one-shot, after fonts ready) and a scroll-drawn connector across
the timeline entries. The Bengali brand name SHALL appear as a large background accent
(aria-hidden). Under reduced motion all text renders statically.

#### Scenario: Timeline from data
- **WHEN** the story section renders
- **THEN** all timeline entries (year, title, description) come from stats.json in order

#### Scenario: Lines reveal once
- **WHEN** a motion-enabled user scrolls the headline into view, away, and back
- **THEN** the reveal plays exactly once and text remains readable

