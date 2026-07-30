# Repo Sync

This site lives in **two GitHub repos that must stay identical**:

| Repo | Path | Remote |
| --- | --- | --- |
| `whatsite` (primary — edit here) | `C:\Users\whatw\OneDrive\Documents\GitHub\whatsite` | https://github.com/Speedy-away/whatsite.git |
| `whatwhatboy-site` (mirror) | `C:\Users\whatw\OneDrive\Documents\GitHub\whatwhatboy-site` | https://github.com/Speedy-away/whatwhatboy-site.git |

Both serve `whatwhatboy.com` (same `CNAME`). **Always edit `whatsite`, then mirror to `whatwhatboy-site`.**
Never edit the mirror directly — the sync overwrites it and your change is lost.

---

## Sync it

From the `whatsite` folder:

```powershell
.\sync.ps1 -Message "your commit message"
```

That copies every tracked file to the mirror, commits both repos, and pushes both.

Preview without changing anything:

```powershell
.\sync.ps1 -DryRun
```

Copy to the mirror but don't push (review first, push manually):

```powershell
.\sync.ps1 -Message "your commit message" -NoPush
```

---

## Sync it by hand

If the script isn't available, from `whatsite`:

```powershell
# 1. Commit + push the primary
git add -A
git commit -m "your message"
git push

# 2. Mirror the files (excludes .git, .claude, sync.ps1, SYNC.md)
robocopy . ..\whatwhatboy-site /MIR /XD .git .claude /XF sync.ps1 SYNC.md

# 3. Commit + push the mirror
cd ..\whatwhatboy-site
git add -A
git commit -m "your message"
git push
cd ..\whatsite
```

> `robocopy /MIR` **deletes** files in the mirror that no longer exist in `whatsite`. That is
> intentional — it is what keeps the two identical — but it means anything only in the mirror is gone.

---

## Check they actually match

```powershell
robocopy . ..\whatwhatboy-site /L /MIR /NJH /NJS /NDL /XD .git .claude /XF sync.ps1 SYNC.md
```

`/L` is list-only. No output rows = the two trees are identical.

---

## What is not synced

| Excluded | Why |
| --- | --- |
| `.git/` | Each repo has its own history and remote |
| `.claude/` | Local Claude Code settings, not site content |
| `sync.ps1`, `SYNC.md` | Tooling for the primary repo only |

Everything else — every `.html`, `css2/`, `assets/`, `games/`, `tools/`, `docs/`, `script.js`,
`service-worker.js`, `CNAME`, `sitemap.xml`, `robots.txt` — is mirrored exactly.

---

## Before you sync — quick checklist

- [ ] Bump `CACHE_VERSION` in `service-worker.js` whenever `script.js`, `style.css`, or `index.html` changes.
      Without it, returning visitors can keep the old cached copy.
- [ ] `CNAME` still reads `whatwhatboy.com` in **both** repos.
- [ ] New pages added to `sitemap.xml`.
- [ ] Open `index.html` locally and click through the game filters (All / PC / Console / Mobile).

---

## Notes

- `data-category` on a `.game-card` accepts **multiple space-separated** values
  (`data-category="pc console"`). The filter in `script.js` matches on any one of them.
  Do not assume a single value — that was the cause of the Console filter showing zero games.
- Both repos are GitHub Pages sites on the `main` branch. A push takes ~1 min to go live.
- Since both point at `whatwhatboy.com`, only one can hold the verified custom domain at a time;
  the other still serves at its `github.io` URL. Keep them identical so it doesn't matter which is live.
