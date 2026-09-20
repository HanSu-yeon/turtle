# Character design reference

`character-reference-v1.webp` — first design moodboard for the Turtle character (2026-09-20).
Not final assets (no transparent/cut-out sprites yet) — style + state reference for Phase 5.

## Mapping to spec states (PRD §11)

| Spec state | Reference panel |
| --- | --- |
| `IDLE` | 기본 (대기 중), 잠자는 중 (대기 상태) |
| `WARNING` | 목 나옴! (알림) |
| `HAPPY` | 좋아요! (자세 회복) |
| overlay hidden | 숨어서 빼꼼 (화면 아래 대기) |

Extra emotions (놀람/궁금/신남/속상/화이팅/지침) are candidates for the "추후 확장" states
the spec mentions (스트레칭, 잠자기, 응원 등) — not needed for MVP.

## Size targets from this sheet

- 앱 내 캐릭터: ~120px
- 알림/오버레이: ~64px
- 메뉴바 아이콘: ~24px
- 파비콘: ~16px

## Open questions before implementation (Phase 5)

- Legibility at 16–24px (menu bar icon, favicon) — eyes/mouth may need to simplify further.
- Contrast against light backgrounds (Notion, Figma, white docs) since the overlay floats
  translucently over arbitrary apps, and against dark desktop backgrounds/wallpapers.
- Need actual transparent PNG/SVG exports (or a commissioned sprite sheet) — this reference
  is a single flattened image with baked-in panel backgrounds and labels, not usable as-is.
