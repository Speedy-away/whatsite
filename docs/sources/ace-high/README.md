<p align="center"><img src="ace-high.png" width="180"></p>

# Ace-High

### Deal yourself a better hand.

A mod menu for **Red Dead Redemption 2** on a jailbroken PS4.

Made by **BigmanModz420**.

**Version 1.1** — see [Releases](https://github.com/BigmanModz420/Ace-High/releases)
for what changed.

> **Ace-High** — depending on the context, this might mean *first-class and respected*,
> or it could mean a winning poker hand.

---

## Before you start

This is my first mod menu, and I am still learning as I go.

Everything in it has been tested on my own consoles before going out, and the parts that
are not finished are listed below rather than left for you to find. But I am one person
with two PS4s, and you will have setups I have never seen.

If something does not work right, tell me — and be kind with it. I am still learning, and
I would much rather hear what is wrong than have people quietly give up on it. Feedback
is welcome, not a nuisance; it is how the next version gets better.

Thanks for giving it a go.

---

## Will it work for me?

You need all three:

- A **jailbroken PS4** with GoldHEN and the Plugin Loader
- **Red Dead Redemption 2** — EU `CUSA08519` or US `CUSA03041`
- **Game version 1.32**

Anything else and the menu simply will not start. It tells you what it found on screen,
so you will know straight away rather than wondering.

**Tested on firmware 5.05 and 9.00, on both the EU and US copies of the game** — all four
combinations, on real hardware.

It is not tied to a firmware version, so it should work on any PS4 running GoldHEN.
Those two are simply the ones that have been checked.

> **Single player only.** Do not take this online. It gets you banned and it ruins other
> people's games.

---

## Install

**1.** Download `Ace-High.prx` from [Releases](https://github.com/BigmanModz420/Ace-High/releases).

**2.** Copy it to your PS4:

```
/data/GoldHEN/plugins/
```

**3.** Add your game to `/data/GoldHEN/plugins.ini` — EU or US, whichever you have:

```
[CUSA08519]
/data/GoldHEN/plugins/Ace-High.prx=true
```

```
[CUSA03041]
/data/GoldHEN/plugins/Ace-High.prx=true
```

**4.** Turn on the GoldHEN Plugin Loader and start the game.

One file to copy, nothing else. The logo is built into the plugin.

### What it creates on your PS4

The first time it runs, the menu makes a folder of its own:

```
/data/Ace-High/
```

Three files end up in there:

| File | What it is |
|---|---|
| `acehigh.ini` | your settings — menu style, open button, hotkeys, saved locations |
| `acehigh.log` | what happened on load, useful if the menu does not start |
| `ace-high.png` | the logo, written out so it can show on the PS4 notifications |

Nothing else on your console is touched, and nothing is written to the game itself.

Deleting that folder resets the menu to defaults. It will simply make it again next
time.

---

## Using it

Open with **R1 + O**. You can change that in Settings.

| Button | Does |
|---|---|
| D-pad up / down | move through the list |
| D-pad left / right | change a setting |
| X | select |
| O | back, or close |

Four cheats can be put on hotkeys, so you can use them without opening the menu.

---

## What is in it

| Menu | What you get |
|---|---|
| **Player** | god mode, invisibility, super run, swim and jump, slow motion, unlimited stamina and dead eye, never wanted, noclip, overpowered cores, explosions and fire wherever you aim |
| **Player → Change Model** | play as any of the 1,859 characters, animals and horses in the game — grouped and named |
| **Player → Outfits** | ready-made outfits, and every garment in the game piece by piece |
| **Player → Law** | set your own bounty and wanted level |
| **Player → Money, Emotes, Scenarios, Animations** | give yourself money, and play any emote, scenario or animation |
| **Weapon Options** | give weapons and ammo, damage, accuracy, one hit kill, dual wield, special ammo |
| **Horse Options** | god mode, super run, stamina, bonding, animations, never fall off, noclip, bring your horse, speed display |
| **Teleports** | waypoint, towns, and your own saved spots with your own names |
| **Spawner** | people, animals, horses, wagons and boats — with a list to delete what you spawned |
| **Spawner → Wagon Options** | super run for the team, speed display, indestructible, keep the horses hitched, horses god mode, flip upright, repair |
| **Weather & Time** | set the weather, set the clock |
| **Settings** | two menu styles, your own open button, hotkeys, screen trims |

---

## Playing as someone else

**Player > Change Model.** Every character, animal and horse in the game, with real
names rather than model ids, split into **Protagonists**, **NPCs** (Story, Unique,
Townsfolk), **Animals** (Animals, Horses) and **Others**. One press and you are them.

Go back to Arthur and he returns in the clothes your save had him in.

> **Use it from chapter 2 onwards.** In chapter 1 it kills you. The chapter's own scripts
> hold the player and will not let go.

A few models come out invisible. If you find one, send the name and it gets removed.

---

## About the clothing names

Clothing shows the game's own names. Where a name repeats - `Trilby Hat`, `Trilby Hat 2`,
`Trilby Hat 3` - those are the colour variants of the same item. Pick any one and press X
to wear it.

Some rows show a number instead, like `Belt 1` or `Hair 12`. The game has no name for
those items, so there is nothing to show. It is not a missing feature and does not need
reporting.

The game has no colour names for single player clothing either, so the variants can only
be numbered.

---

## Speed on screen

**Speed Display** on Horse Options or Wagon Options: **Off**, **MPH** or **KM/H**. It
puts a small bar under the hint showing how fast whatever is carrying you is actually
going — your horse, or the wagon you are sitting in. Off by default, and your choice is
saved.

**Super Run on a wagon** tops out around 80 mph. It will not push while the wagon is off
the ground, and it is held down over hills so it does not launch. Those numbers are a
first pass and will likely change in a later version.

---

## Playing with HDR on

The menu colours wash out and the text sits slightly high.

Settings has two trims to put it right — **Text Height** and **Panel Depth**. Set them by
eye once, save, and you are done.

---

## Still being worked on

Not finished. Listed so you know they are missing on purpose.

| | What happened |
|---|---|
| **Auto ride** | Several versions tried. None would follow the road or the GPS line properly, so it was taken out rather than shipped half working. |
| **Honor** | No way found to set it. |
| **Horse animations while riding** | They only play when you are off the horse — the riding system overrides them. |
| **Some wagons** | A few wagon names come back as a bad model and will not spawn. |
| **Some models** | A few come out invisible when you change into them. Send the name and it gets removed. |
| **Wagon super run** | Working, but the speed, the steering and how it handles hills are a first pass and will be tuned. |

---

## Help, bugs and bad models

**Found a bug? Please say.** It is the only way these get fixed.

Worth including:

- **What you did**, and what happened instead
- **A photo of the screen** — often the quickest way to show it
- **The menu's own message.** On loading, it shows a line like
  `Ace-High Menu: At The Table - CUSA08519 01.32.` That names your game and version,
  which is the first thing worth knowing.
- **The log**, if the menu never starts: `/data/Ace-High/acehigh.log`. The last line
  usually says why it stopped.

**Menu not opening at all?**

- **No messages on screen** when the game loads — the plugin never loaded. Check the
  path, that the `plugins.ini` section matches your game, and that the Plugin Loader
  is on.
- **A message saying `inert`** — it loaded, but your game is not supported. The message
  says what it found.

**Bad wagon or ped models.** If a model comes back as a bad model, send the name. A list
of names that do not work is genuinely useful — they can be removed or replaced.

**Other languages.** The menu is English only at the moment. If you would like it in
your language — or you have tried naming a saved location in one and seen how it turns
out — let me know. It is not something I can test on my own.

**Know RDR2 and want to help?** The list above is honest about what was tried. If you
know the missing piece on any of them, get in touch.

**Where to reach me:** open an
[issue](https://github.com/BigmanModz420/Ace-High/issues) on this repo.

And thank you. Anyone who takes the time to send a bug, a photo or a model name is
doing me a real favour, and the next version will be better for it.

---

## Source code

The source will be **made open** once the menu is finished. For now this release is the
plugin only.

---

## Credits

**Ace-High** by **BigmanModz420**

[**cowboy-menu**](https://github.com/ricardoofnl/cowboy-menu) base by **ricardoofnl**,
used with permission. The Cowboy Base style is their design, kept as it was.

[**DaOfficialGaming**](https://www.youtube.com/@DaOfficialGaming), Thanks for covering Ace-High
on YouTube — [watch the video](https://www.youtube.com/watch?v=ghKVoFNrgH8&t=4s).

**Claude** (Anthropic), for the difficult code and for teaching me how the game works
underneath it.
