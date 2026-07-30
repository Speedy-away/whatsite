# Repo Sync

This site lives in **two GitHub repos that must stay identical**:

| Repo | Path | Remote |
| --- | --- | --- |
| `whatsite` | `C:\Users\whatw\OneDrive\Documents\GitHub\whatsite` | https://github.com/Speedy-away/whatsite.git |
| `whatwhatboy-site` | `C:\Users\whatw\OneDrive\Documents\GitHub\whatwhatboy-site` | https://github.com/Speedy-away/whatwhatboy-site.git |

Both serve `whatwhatboy.com` (same `CNAME`).

**Edit either one.** The sync runs in whichever direction you worked — change something in
`whatwhatboy-site` and it flows back to `whatsite` just the same.

---

## Sync it

Run from **either** repo folder:

```powershell
.\sync.ps1 -Message "your commit message"
```

It works out the direction, copies that side over the other, then commits and pushes both.

```powershell
.\sync.ps1 -DryRun          # show direction + files that would change, touch nothing
.\sync.ps1 -Message "..." -NoPush   # copy and commit, push yourself later
```

Always start with `-DryRun` if you're unsure — it prints the direction before doing anything.

---

## How it picks the direction

| Situation | Source |
| --- | --- |
| Only one repo has uncommitted changes | That one |
| Neither has changes | The one with the newer last commit |
| **Both** have uncommitted changes | **Stops and asks** |

That last case is deliberate. If you've edited both copies, one set of edits has to lose, and
the script won't pick for you. Commit or discard one side, or name the winner yourself:

```powershell
.\sync.ps1 -From whatwhatboy-site -Message "..."
.\sync.ps1 -From whatsite -Message "..."
```

---

## Sync it by hand

If the script isn't available — swap the two paths to reverse the direction:

```powershell
# 1. Commit + push the side you edited
git add -A
git commit -m "your message"
git push

# 2. Mirror the files to the other side
robocopy . ..\whatwhatboy-site /MIR /XD .git .claude /XF sync.ps1 SYNC.md

# 3. Commit + push the other side
cd ..\whatwhatboy-site
git add -A
git commit -m "your message"
git push
```

> `robocopy /MIR` **deletes** files in the destination that no longer exist in the source. That is
> what keeps the two identical, but it means anything living only in the destination is gone.
> This is exactly why the script refuses to guess when both sides have edits.

---

## Check they actually match

```powershell
.\sync.ps1 -DryRun
```

"Already in sync. Nothing to copy." means the trees are identical.

---

## What is not synced

| Excluded | Why |
| --- | --- |
| `.git/` | Each repo has its own history and remote |
| `.claude/` | Local Claude Code settings, not site content |
| `sync.ps1`, `SYNC.md` | Tooling — kept in both repos, never overwritten by a sync |

Everything else — every `.html`, `css2/`, `assets/`, `games/`, `tools/`, `docs/`, `script.js`,
`service-worker.js`, `CNAME`, `sitemap.xml`, `robots.txt` — is mirrored exactly.

---

## Before you sync — quick checklist

- [ ] Bump `CACHE_VERSION` in `service-worker.js` **and** the `?v=` query strings on
      `style.css` / `script.js` in the HTML whenever those files change. Both must match, or
      returning visitors keep the old cached copy. (75 HTML files carry the `?v=` string —
      `sed -i 's/v=3\.1\.1/v=3.1.2/g'` across them is the quick way.)
- [ ] `CNAME` still reads `whatwhatboy.com` in **both** repos.
- [ ] New pages added to `sitemap.xml`.
- [ ] Open `index.html` locally and click the game filters (All / PC / Console / Mobile).

---

## Gotchas worth knowing

- **`data-category` takes multiple space-separated values** (`data-category="pc console"`).
  The filters in `script.js` match on any one of them. An exact-string comparison was why the
  Console and Mobile filters used to return zero games.
- **No spaces in image filenames.** A trailing space before the extension
  (`Xenia .png`) needs `%20` in every URL and breaks on some hosts. Keep them clean.
- **Image folders**: `assets/images/emulators/` for emulator logos,
  `assets/images/consoles/` for console/brand art. Moving a file out of `assets/images/`
  breaks every page referencing the old path — grep before you move.
- Both repos are GitHub Pages sites on `main`. A push takes ~1 min to go live.
- Since both point at `whatwhatboy.com`, only one holds the verified custom domain at a time;
  the other serves at its `github.io` URL. Keeping them identical means it doesn't matter which.
