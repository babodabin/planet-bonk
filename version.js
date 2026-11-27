// Planet Bonk — 버전은 이 한 줄만 바꾸면 화면 표시 · 오프라인 캐시 이름 · 업데이트 기록이 모두 따라감
var APP_VERSION = '2.2';

// 업데이트 기록 (위가 최신): [날짜, 버전, 바뀐 것]
var APP_LOG = [
  ['2026-11-26', '2.2', 'Gravity no longer grows with level, every bonk lifts the field a little, the Sun joins at LEVEL 13. Game number, update log and safer saves.'],
  ['2026-11-24', '2.1', 'Harder game from LEVEL 1: shots bend down, planets drop in from the top, short aim line.'],
  ['2026-11-24', '2.0', 'Space junk, asteroids, black holes and solar flares grow with level. Big planets join later.'],
  ['2026-11-24', '1.9', 'MY SHIP: upgrade from satellite to saucer, each with more points and a power. Send it on trips.'],
  ['2026-11-24', '1.8', 'Clear BACK TO MENU button on the game over screen.'],
  ['2026-11-24', '1.7', 'Start with the Moon, gravity after each shot, guide numbered by size, quieter sound with a volume setting.'],
  ['2026-11-24', '1.6', 'Backup codes, daily goals, bonuses for grown planets, shields.'],
  ['2026-11-24', '1.5', 'MY SPACE grows: Stardust, planet levels and colors, moons, spacecraft, dwarf planets, other worlds.'],
  ['2026-11-24', '1.3', 'MY SPACE: your planets orbit Earth.']
];
if (typeof self !== 'undefined') { self.APP_VERSION = APP_VERSION; self.APP_LOG = APP_LOG; }
