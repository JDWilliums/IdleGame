# 18.4 · Trusting time & cheating

> ⏱ 2.5 hours · Module 18 · Cloud Saves & Sync

## What you'll learn
- Why the device clock can't be trusted, and what that means for offline progress
- Measuring the offset between the device clock and the server's
- Calculating offline time from server timestamps
- What a client-side game can and can't defend against
- Server-side plausibility checks, and keeping the leaderboard honest

---

## The oldest idle-game cheat

Offline progress (13.8) is "now − last saved time" turned into rewards. On the device, "now" is `Date.now()`, which reads the device clock, and the player can set that clock to next year. Close the game, change the date, reopen it, and collect a year of progress.

Even without cheating, device clocks drift, change at daylight saving (if code wrongly uses local time), get corrected by the network, and jump when a phone crosses time zones. **Device time is a hint, not a fact.**

## Sources of time

| Clock | Trustworthy? | Good for |
|---|---|---|
| `Date.now()` on the device | no: the player controls it | showing times to the player |
| `performance.now()` | yes, *within one page session*: it's monotonic and can't be set | measuring elapsed time while the game is open (the game loop, 13.4) |
| The server's clock | yes (you control it) | offline progress, timestamps on saves, rate limits |

Inside a session, the game loop measures time with `performance.now()`, which only ever increases, so changing the device clock while playing does nothing. The problem is the gap **between** sessions, when the page wasn't running.

## Using server time for offline progress

The server stamps every accepted save with **its own** time (`updated_at`). When the game opens and syncs, the server can say how long it's really been:

```
offline elapsed = server "now" − server's updated_at of the last save from this device
```

The device clock isn't involved at all. If the device also computes its own estimate from `lastSavedAt`, you can compare them. A big difference (more than a few minutes either way) means the device clock was changed while the game was closed. That's worth logging, using the server's value, and possibly flagging.

What if the player is offline when the game opens? Then the device clock is all there is. Options, from lenient to strict:

1. Use it, with the usual cap (13.8). Simple, and cheating only affects that player's single-player game.
2. Use it, and **re-check when the device next reaches the server**. If the server's elapsed time is much less than what was granted, flag the save.
3. Don't grant offline progress until it can be confirmed online. Accurate, but it punishes honest players on trains.

Hearthwild uses option 2: it's friendly to honest offline play and still catches the cheat for leaderboard purposes.

## Estimating the clock offset

Sometimes the client needs to know server time **during** play, e.g. to show "event ends in 3:12:00" correctly on a device whose clock is wrong. The client measures the offset between its clock and the server's, NTP-style:

```
client sends at t0 (device clock)
server answers with its time S
client receives at t1 (device clock)

round trip  = t1 − t0
offset      ≈ S − (t0 + round trip / 2)      ← assumes the reply took half the round trip
server now  ≈ Date.now() + offset
```

The "half the round trip" assumption is wrong when the network is slower in one direction. The longer the round trip, the bigger the possible error. So take **several samples** and trust the one with the **shortest round trip**: it has the smallest possible error. Discard samples with a negative round trip (the device clock jumped mid-request). Exercise 18-04 implements this.

The server can include its time on every response for free: HTTP responses already carry a `Date` header (to the second), or add `serverTime` to the JSON of `/api/save/meta` for millisecond precision.

## What you can't prevent

Everything on the player's device is under their control. With DevTools, they can:

- edit the save in `localStorage`
- change variables in the running game
- call your API directly with any payload they like
- modify the JavaScript itself

Obfuscating code or encrypting the local save only slows a determined player down by minutes. Don't spend time on it.

**Does it matter?** For a single-player idle game, a cheater mostly spoils their own fun. The things worth protecting are the ones that affect **other** players:

- the leaderboard
- anything traded or shared between players (if you ever add it)
- anything that costs you real money (purchases)

## Server-side plausibility checks

The server knows the previous accepted save, the new one, and (from its own clock) how long it's been between them. The game's data tells it the **fastest possible** rate of progress: no action in Hearthwild gives more than a known amount of XP per second, and no combination of actions earns gold faster than some known rate.

So on every `PUT`, the server can check:

```
for each skill:
  gained  = new xp − old xp
  allowed = maxXpPerSecond × (elapsed + slack) / 1000
  gained < 0         → "XP went down" (impossible in normal play)
  gained > allowed   → "XP gained faster than possible"
gold gained > allowed gold → "gold gained faster than possible"
```

- **Slack** gives honest players room: queued offline progress, clock skew, a little imprecision in the maximum rates.
- **Gold going down is normal** (spending). XP going down never is.
- Compute the maximum rates from the game data with the same code the client uses (19.2), so they stay correct as the game changes.

Exercise 18-04 builds this check as a pure function.

### What to do with a failed check
Not every flag is a cheater. A bug in your offline calculation, a save from before a game-data change or a clock problem can all trip it. So:

- **Store the save anyway**, so the player loses nothing.
- **Keep it off the leaderboard** (set `leaderboard_eligible = false`, or don't update `skill_xp` for it), and record why.
- Log it, and review the flags now and then. A spike right after a release usually means a bug in your rates, not a wave of cheaters.
- Never ban automatically on a heuristic.

### The real fix, and why we don't use it
A **server-authoritative** game runs the simulation on the server: the client only sends commands ("start fishing"), and the server computes the results. Multiplayer games work this way because it's the only way to fully prevent cheating. It also means the game can't run offline, and the server does all the work for every player. For a single-player idle game, plausibility checks get most of the benefit at a fraction of the cost. That's a trade-off worth being able to explain in an interview.

## Check your understanding

1. Why can't offline progress trust `Date.now()` on the device?
2. Why is `performance.now()` safe within a session but useless between sessions?
3. How does the server calculate offline time without the device clock?
4. Why use the sample with the shortest round trip when estimating clock offset?
5. Name two things a client-side game cannot prevent.
6. What does a plausibility check compare, and why is "slack" needed?
7. Why store a save that fails the check, rather than rejecting it?

<details><summary>Answers</summary>

1. The player controls the device clock and can move it forward, and clocks also drift and jump for innocent reasons.
2. It's monotonic and can't be set, but it starts again from zero with each page load, so it can't measure time while the game wasn't running.
3. It subtracts its own timestamp of the last accepted save from its own current time.
4. Its error is smallest: the true one-way delay can be anywhere within the round trip, so a shorter round trip bounds the error more tightly.
5. Any two of: editing the local save; changing variables in the running game; calling the API directly with any payload; modifying the code.
6. The progress gained between two saves against the maximum possible for the server-measured elapsed time. Slack covers honest edge cases such as offline progress, clock skew and rounding.
7. The flag may be a false positive. Storing it loses nothing for the player, and keeping it off the leaderboard is enough to protect other players.
</details>

## Further reading
- Gabriel Gambetta, "Fast-Paced Multiplayer" (gabrielgambetta.com), for how server-authoritative games work
- Wikipedia: "Network Time Protocol", the "Clock synchronization algorithm" section

---
[← Conflicts & concurrency](03-conflicts-and-concurrency.md) · [Module overview](README.md) · [Next: The sync engine →](05-the-sync-engine.md)
