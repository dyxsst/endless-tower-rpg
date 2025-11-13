***

# Endless Tower RPG — **Labyrinth Combat Edition**

**GDD v1.3 (Updated)**

## 1) Vision

An **endless, floor-by-floor roguelite RPG** where you navigate a **procedurally generated labyrinth**, **bump** into enemies to exchange blows, and tactically use **ranged attacks and magic** to control positioning and risk. You may **grind** on a floor by engaging visible spawns before ascending, staying slightly ahead of the difficulty curve through smart play, not grind alone.

**Feel:** Fast turns, tight feedback, lightweight decisions that stack into sustained runs.

***

## 2) Player Promise

*   **Agency:** Choose your fights. Grind visible enemies or rush the exit.
*   **Tactile combat:** *Movement is intent.* Bump to hit; ranged to soften or control.
*   **Fair scaling:** Enemies scale with floor, gear scales with floor, your stats scale with XP and items.
*   **Endless mastery:** No hard cap—survive through positioning, timing, and gear choices.

***

## 3) Core Pillars

1.  **Bump-to-attack**: immediate impact with micro-juice (hitstop, shake, damage popups).
2.  **Meaningful maze**: rooms, corridors, loops, optional secrets; no “obvious arrow” to exit.
3.  **Visible spawns**: grinding is an informed, deliberate choice.
4.  **Simple math, deep play**: readable stats, predictable results, low randomness.
5.  **Ranged options**: bows & magic expand tactics without bloating complexity.

***

## 4) Gameplay Loop

1.  **Enter Floor N** → maze revealed (fog optional), exit not trivial to find.
2.  **Explore** → see enemies, loot nodes, and optional spawn pads.
3.  **Engage** → bump or shoot; defeat enemies for XP, gold, items; partial heal.
4.  **Decide** → spawn more (grind) or **Ascend** to N+1 (boss/shops on milestones).
5.  **On death** → run summary, best floor recorded, optional light meta unlocks.

***

## 5) World Structure & Progression

*   **Floors:** Infinite sequence; every 5th is a **milestone** (boss + shop + guaranteed better loot).
*   **Spawn pressure:** The longer you stay on a floor, new spawns drift stronger (soft timer).
*   **Rewards:** XP and gold scale with enemy difficulty; items scale with floor and rarity.

***

## 6) Labyrinth Generation (Meaningful, Not Obvious)

**Goals:** Good navigation puzzles, tactical spaces for combat, multiple viable routes, secrets.

### 6.1 Layout Style

*   **Rooms & Corridors**: A mix of small/medium rooms connected by corridors.
*   **Loops & Dead Ends**: Include purposeful dead ends with loot and optional loops to avoid linearity.
*   **Chokepoints**: Narrow passages that matter tactically against groups and ranged enemies.
*   **Landmarks**: Occasional unique tiles (statue, fountain, shrine) for orientation.

### 6.2 Generator Outline (Tech-agnostic)

*   **Phase A — Macro:**
    *   Pick a start region and an exit region far apart.
    *   Use **room placement** (random sizes within bounds), ensure **minimum spacing**.
    *   **Connect rooms** via shortest corridor graph (e.g., minimum spanning tree style), then **add cycles** (loops) by connecting extra pairs: target **braid/loop ratio** ≈ 10–25%.
*   **Phase B — Micro:**
    *   Carve small **alcoves** and **niches** for chests/traps.
    *   Place **locked doors & keys** (optional): ensure solvable path with key on viable route.
    *   Sprinkle **secret walls** (optional) leading to shortcuts or loot (visually hint with subtle cracks).
*   **Phase C — Populating:**
    *   Place **spawn pads** at periphery or special tiles (clearly visible).
    *   Position **enemies** in rooms/corridors with tier mix appropriate to the floor.
    *   Place **exit** in a different region from the start with at least two plausible approaches.

### 6.3 Meaningfulness Heuristics

*   **At least 2 non-overlapping routes** to exit (one longer, one riskier/shorter).
*   **At least 1 optional loop** enabling tactical flanks or kiting.
*   **Dead ends reward** (loot, shrine) at least 60% of the time.
*   **No straight beeline**: average “obviousness score” stays low (measured by branching factor near the start and early forks hiding the exit direction).

***

## 7) Player Systems

### 7.1 Core Stats

*   **HP, ATK, DEF, SPD, CRIT** (percent).
*   **Leveling:** Linear-ish XP curve; each level grants small stat bumps.
*   **Gear Slots:** Weapon, Armor, Charm, Boots.
*   **Resources (optional):**
    *   **Stamina/Focus** for Bow (limited shots, refresh slowly or on kill).
    *   **Mana/Charges** for Magic (refresh at milestones or via consumables).

### 7.2 Movement & Turn Economy

*   **Grid-based, 4-directional**.
*   **One step = one turn**.
*   Enemies advance **after** your step; faster enemies may occasionally double-step (telegraphed at higher floors).

### 7.3 Combat Actions

*   **Melee (Bump)**: Step into an enemy’s tile → your hit resolves; if enemy survives, instant **retaliation**.
*   **Bow (Ranged)**: Fire in straight line up to **Range R** (e.g., 3–5 tiles), reduced base damage vs melee.
*   **Magic (Ranged/Utility)**:
    *   **Firebolt**: single-target range; ignores some DEF.
    *   **Fireball**: small AoE (e.g., 3×3), lower base damage per target.
    *   **Frost**: applies **Slow** (−SPD) for X turns.
    *   **Spark**: chains to adjacent enemies (light AoE).
*   **Defend/Guard** (optional): Halve next damage until your next step.
*   **Dash** (optional): Move 2 tiles without attacking, limited by cooldown.

### 7.4 Line of Sight (LOS) & Cover

*   **LOS required** for bows and most spells.
*   Walls and closed doors block LOS.
*   Ranged enemies play around corridors; doors offer **safe reset points**.

***

## 8) Enemy Systems

### 8.1 Archetypes

*   **Melee Walker**: Closes distance; bump trades.
*   **Archer**: Shoots if LOS and within range; steps back if you close.
*   **Mage**: Casts AoE/status if you’re in pattern; weaker on melee bump trades.
*   **Protector (Elite)**: Alternates guard state; reduced damage taken each other turn; higher DEF.
*   **Charger**: Telegraphs a line attack next turn; if you step into line, high retaliation.
*   **Boss**: Large HP, mixed pattern (guard → heavy swing → special). Forced fight on milestones.

### 8.2 Enemy Turn Rules

*   After your move, each nearby enemy:
    1.  **If adjacent and you enter its tile**, it retaliates (already covered by bump logic).
    2.  Else if **in range & LOS**, performs ranged attack.
    3.  Else **move 1 tile** toward player using simple shortest step (ties random).
*   **Elite/Boss modifiers**: multipliers to HP/ATK/DEF; occasional pattern overrides (telegraphed).

***

## 9) Items, Loot & Economy

### 9.1 Rarity & Drop

*   **Rarity:** Common (70%), Uncommon (22%), Rare (7%), Epic (1%).
*   **Drop Chance per fight:** 30% base + small increases with floor; cap \~60%.
*   **Floor Scaling:** Item power increases with floor; floor defines stat rolls.

### 9.2 Item Effects

*   **Weapon:** +ATK; if **Bow** item equipped, unlocks ranged basic shot (R tiles, −X% melee damage baseline).
*   **Armor:** +DEF; some variants reduce incoming crit chance.
*   **Charm:** +HP; can add on-hit effects (e.g., 10% chance **Bleed**).
*   **Boots:** +SPD; may increase dash distance or reduce ranged cooldowns.

### 9.3 Consumables (Optional)

*   **Potion:** Heal %HP.
*   **Focus Tonic:** Restore bow stamina/charges.
*   **Mana Flask:** Restore spell charges.

### 9.4 Shops (Milestones)

*   Appear every 5 floors, offering:
    *   Potions/charges.
    *   Reroll or upgrade gear (small, guaranteed improvement).
    *   One “relic” (run modifier) choice.

***

## 10) Balance & Formulas (Tuning Defaults)

> Numbers are intentionally conservative—easy to tweak.

### 10.1 Player (Level L)

*   **Base (L=1):** HP 30, ATK 6, DEF 2, SPD 5, CRIT 5%.
*   **Per Level:** HP +6, ATK +2, DEF +1, SPD +0.2.
*   **XP to Next:** `20 + 10*L`.

### 10.2 Enemies (Floor F)

*   **HP:** `20 + 6F + floor(F^1.15)`
*   **ATK:** `5 + 1.6F`
*   **DEF:** `1 + 0.6F`
*   **SPD:** `4 + 0.15F`
*   **Elite Mod:** HP ×1.35, ATK ×1.2, DEF ×1.2
*   **Boss Mod:** HP ×1.6, ATK ×1.2, DEF ×1.2

### 10.3 Damage

    variance ∈ [0.9, 1.1]
    raw = AttackerATK - (0.6 * DefenderDEF)
    dmg = max(1, round(raw * variance))
    crit: x2 damage at CRIT%

### 10.4 Ranged Scalars

*   **Melee (bump):** 100% damage.
*   **Bow:** 70–85% of melee baseline; range R=3–5; requires LOS; optional limited charges or cooldown.
*   **Magic (single target):** 80–100% baseline, can **ignore 20% DEF**.
*   **Magic (AoE):** 50–70% baseline per target; small radius; cooldown/charges.

### 10.5 Rewards

*   **XP Gain (per fight):** `max(5, round(totalEnemyHP/10))`
*   **Gold Gain (per fight):** `max(2, round(totalEnemyHP/14))`
*   **Post-fight Heal:** 20–30% of max HP (tunable).
*   **Level-up Heal:** \~40% of max HP.

### 10.6 Grinding Pressures

*   **Spawn Drift:** Every few fights on same floor, new spawns shift +1 tier weight (visible color cue).
*   **Spoils Diminish:** After N fights on same floor, −10% XP/gold per extra fight (tooltip: “Diminishing spoils”).

***

## 11) UI/UX

### 11.1 Layout

*   **Top:** Floor, mini-map toggle, HP/XP bars, gold, equipped items.
*   **Center:** Labyrinth view (10–14 tiles wide × 7–10 tall). Player centered. Enemies show tier badges and HP bars on approach.
*   **Bottom:** Action strip (Bow, Spells, Potion, Dash) + **one-line battle ticker**.
*   **Side Panel (toggle):** Stats, gear, inventory, item tooltips.

### 11.2 Feedback & “Game Feel”

*   **On hit:** brief hitstop (50–120ms), micro screen shake (2–4px), red damage popups, enemy flicker.
*   **On retaliation:** white flash on player, HP bar animates down.
*   **Crit:** gold flash + “CRIT!” popup.
*   **Death:** grayscale fade + “Defeated on Floor N” with run summary.

### 11.3 Readability

*   **Rarity colors** (gray/green/blue/purple).
*   **Damage colors:** red (dealt), white (taken), green (healed).
*   **Accessibility toggles:** reduced motion, high contrast, numeric overlays.

***

## 12) Spawn & Encounter Rules

### 12.1 Visible Spawns

*   **Spawn pads** periodically generate new enemies (telegraphed arrival).
*   **Scout action** can call an extra spawn with small risk of higher tier.

### 12.2 Engagement

*   **Bump** starts melee exchange instantly.
*   **Ranged** can initiate from distance; enemies may respond with movement or their own ranged attacks if in LOS and range.

### 12.3 Multi-Enemy Situations

*   Only the **bumped target** exchanges immediately.
*   **Nearby enemies** advance on their subsequent turn; area spells can tag multiple before they close in.
*   **Line tactics** matter: funneling, peeking out of doorways to take single shots.

***

## 13) Status Effects (Simple Set)

*   **Bleed:** Take small damage at the end of your next N turns.
*   **Poison:** As Bleed but less burst, longer duration.
*   **Slow:** −SPD for N turns (affects turn order/double-step thresholds).
*   **Vulnerable:** +X% damage taken for N turns.
*   **Burn:** Low DoT; amplifies next fire hit by small % (optional synergy).

***

## 14) Content Targets

### 14.1 Enemies (per tier)

*   **Normal:** Slime, Goblin, Wolf, Specter (mix of melee/ranged-lite).
*   **Elite:** Protector, Charger, Archer Captain, Acolyte Mage.
*   **Bosses:** 1 per milestone set (e.g., Warden, Obsidian Knight, Floor Guardian variants).

### 14.2 Items

*   **Bow variants:**
    *   *Shortbow*: Range 3, 85% damage.
    *   *Longbow*: Range 4, 80% damage.
    *   *Recurve*: Range 3, 85% damage, +crit chance.
*   **Spells (via tomes/charms):**
    *   Firebolt, Fireball, Frost, Spark.
*   **Armor/Boots/Charms:** Floor-scaled stat rolls, occasional secondary perks.

***

## 15) Milestones & Shops

*   **Every 5 floors:**
    *   **Boss room** near exit.
    *   **Shop** with 3–5 items/consumables and one **relic**.
    *   **Guaranteed Uncommon+ drop** on boss kill.
*   **Heal Station:** small heal on entering milestone, optional purchase for larger heal.

***

## 16) Metrics & Tuning Targets

*   **Fight length:**
    *   Normal: 1–3 bump exchanges or 1–2 ranged set-ups + 1 bump.
    *   Elite: 5–10 exchanges.
    *   Boss: 12–20 exchanges with visible patterns.
*   **Per-floor fights (player choice):** 2–6.
*   **Session reward cadence:** item upgrade or level every 3–5 minutes.
*   **Difficulty curve:** gently rising; boss spikes that are surmountable with prep.

***

## 17) Acceptance Criteria (MVP)

*   Procedural labyrinth **with loops and branching**; exit not obvious from start.
*   Player can **move**, **bump-attack**, **shoot bow**, and **cast at least 1 spell**, all with clear LOS rules.
*   Enemies include both **melee** and **ranged** archetypes; bosses exist at milestones.
*   **Visible spawns** allow deliberate grinding; **spawn drift** increases risk when overfarming.
*   **Loot scales** by floor; **level ups** and **gear** change stats visibly.
*   **Partial heal** after fights; **shop** every 5 floors.
*   **Run ends on death**, tracking best floor; **endless** otherwise.

***

## 18) Stretch Goals (Still Simple)

*   **Knockback on crits** (if tile open).
*   **Traps** that hurt both sides (spikes, darts).
*   **Relics** that shift play (e.g., +1 tile knockback, +10% ranged damage, +1 spell radius).
*   **Daily Seed Mode** for shared runs.
*   **Light meta**: cosmetics/titles based on best floor.

***

## 19) Test Plan (Functional & Balance)

### 19.1 Functional

*   **LOS tests:** corners, doors, diagonal blockers.
*   **Collision tests:** multi-enemy adjacency; bump resolves single target.
*   **Generator sanity:** start and exit placed; at least two valid routes; solvability with locks/keys on.
*   **UI feedback:** every hit shows number + bar change + micro-hitstop.

### 19.2 Balance

*   Validate floors **1, 5, 10, 20** for:
    *   Time-to-kill (TTK) within targets.
    *   Post-fight HP trend (no death spiral, no trivial healing).
    *   Ranged value: bow shouldn’t replace melee; ideal **set-up tool**.
    *   Magic: AoE useful vs. groups, not single-target DPS king.

***

## 20) Glossary

*   **Bump Combat:** Moving into an enemy’s tile to attack and potentially draw retaliation.
*   **LOS (Line of Sight):** Clear, unobstructed straight line between two tiles.
*   **Spawn Drift:** Probability of higher-tier enemies increases the longer you stay on a floor.
*   **Milestone:** Every 5th floor; includes boss and shop.

***

## 21) Designer Notes

*   Keep **melee as the highest single-target DPS**, with **ranged as safe, lower-DPS setup**.
*   **Magic**: introduce control (Slow) and situational AoE; cap raw DPS via charges/cooldowns.
*   The **maze must do real work**: spaces create tactics (funneling, peeking, flanking).
*   Resist complexity creep: add depth via **numbers and terrain**, not new subsystems.

***

### Optional Tuning Snapshot (Starting Values)

| System          | Value (default)                                           |
| --------------- | --------------------------------------------------------- |
| Bow Range       | 3 tiles (later drops 3–5)                                 |
| Bow Damage      | 80% of melee base                                         |
| Fireball        | 3×3 AoE, 60% base per target, 1–2 turn cooldown/charge    |
| Frost           | −30% SPD for 3 turns                                      |
| Post-fight Heal | 25% of max HP                                             |
| Spawn Drift     | +1 tier weight per 3 fights on the same floor             |
| Spoils Diminish | −10% XP/gold after 6 fights on the same floor (per fight) |

***