<#
.SYNOPSIS
    Keeps whatsite and whatwhatboy-site identical, in whichever direction you edited.

.DESCRIPTION
    Both repos serve whatwhatboy.com and must stay byte-identical.
    Run this from EITHER repo. It works out which side you changed and copies
    that side over the other, then commits and pushes both.

    Direction is decided like this:
      1. If only one repo has uncommitted changes, that one is the source.
      2. If neither does, the one with the newer last commit is the source.
      3. If BOTH have uncommitted changes it stops, because guessing could
         throw away your work. Pick a side with -From.

    See SYNC.md for details.

.EXAMPLE
    .\sync.ps1 -Message "add ps5 emulators"
    Auto-detects which repo you edited and syncs it to the other.
.EXAMPLE
    .\sync.ps1 -DryRun
    Shows the direction and the files that would change. Touches nothing.
.EXAMPLE
    .\sync.ps1 -From whatwhatboy-site -Message "fix typo"
    Forces the direction instead of auto-detecting.
#>
[CmdletBinding()]
param(
    # Commit message used for both repos. Required unless -DryRun.
    [string]$Message,

    # Force the direction. Accepts a repo name or a full path.
    [string]$From,

    # Show the direction and the file list, then exit. Changes nothing.
    [switch]$DryRun,

    # Copy and commit, but don't push.
    [switch]$NoPush
)

$ErrorActionPreference = 'Stop'

# The two repos, as siblings of whichever one this script sits in.
$Here    = $PSScriptRoot
$Parent  = Split-Path $Here -Parent
$RepoA   = Join-Path $Parent 'whatsite'
$RepoB   = Join-Path $Parent 'whatwhatboy-site'

# Never mirrored - see "What is not synced" in SYNC.md
$ExcludeDirs  = @('.git', '.claude')
$ExcludeFiles = @('sync.ps1', 'SYNC.md')

function Write-Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }
function Write-Ok($text)   { Write-Host "    $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "    $text" -ForegroundColor Yellow }

function Assert-Repo($path, $label) {
    if (-not (Test-Path $path)) { throw "$label not found: $path" }
    if (-not (Test-Path (Join-Path $path '.git'))) { throw "$label is not a git repo: $path" }
}

function Test-Dirty($path) {
    $status = & git -C $path status --porcelain
    if ($LASTEXITCODE -ne 0) { throw "git status failed in $path" }
    return -not [string]::IsNullOrWhiteSpace(($status | Out-String))
}

function Get-LastCommitTime($path) {
    $ts = & git -C $path log -1 --format=%ct 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $ts) { return 0 }
    return [int64]$ts
}

# --- Preflight ---------------------------------------------------------------

Assert-Repo $RepoA 'whatsite'
Assert-Repo $RepoB 'whatwhatboy-site'

if (-not $DryRun -and -not $Message) {
    throw "-Message is required (or use -DryRun to preview)."
}

# --- Work out which way to copy ---------------------------------------------

$dirtyA = Test-Dirty $RepoA
$dirtyB = Test-Dirty $RepoB

if ($From) {
    # Explicit override: accept a name or a path.
    $resolved = switch -Wildcard ($From) {
        '*whatwhatboy-site' { $RepoB; break }
        '*whatsite'         { $RepoA; break }
        default             { throw "-From must be 'whatsite' or 'whatwhatboy-site' (got '$From')." }
    }
    $Source = $resolved
    $reason = "forced with -From"
}
elseif ($dirtyA -and $dirtyB) {
    throw @"
Both repos have uncommitted changes, so the direction is ambiguous.
Syncing now could overwrite work in one of them.

  whatsite         : uncommitted changes
  whatwhatboy-site : uncommitted changes

Commit or discard one side, or choose explicitly:
  .\sync.ps1 -From whatsite -Message "..."
  .\sync.ps1 -From whatwhatboy-site -Message "..."
"@
}
elseif ($dirtyA) { $Source = $RepoA; $reason = "it has uncommitted changes" }
elseif ($dirtyB) { $Source = $RepoB; $reason = "it has uncommitted changes" }
else {
    # Both clean - go with whichever was committed to most recently.
    $timeA = Get-LastCommitTime $RepoA
    $timeB = Get-LastCommitTime $RepoB
    if ($timeA -ge $timeB) { $Source = $RepoA; $reason = "both clean, it has the newer commit" }
    else                   { $Source = $RepoB; $reason = "both clean, it has the newer commit" }
}

$Target = if ($Source -eq $RepoA) { $RepoB } else { $RepoA }

Write-Step "Direction"
Write-Host "    $(Split-Path $Source -Leaf)  ->  $(Split-Path $Target -Leaf)" -ForegroundColor White
Write-Ok   "source chosen because $reason"

$RoboArgs = @($Source, $Target, '/MIR', '/NJH', '/NJS', '/NP', '/NDL',
              '/XD') + $ExcludeDirs + @('/XF') + $ExcludeFiles

# --- Dry run -----------------------------------------------------------------

if ($DryRun) {
    Write-Step "Dry run - files that would change in $(Split-Path $Target -Leaf)"
    # /L lists without copying; /NDL drops directory headers so only files show.
    & robocopy @RoboArgs /L
    $code = $LASTEXITCODE
    if ($code -ge 8)      { throw "robocopy failed with exit code $code" }
    elseif ($code -eq 0)  { Write-Ok "Already in sync. Nothing to copy." }
    else                  { Write-Warn "Files above would be copied or deleted. Re-run with -Message to apply." }
    exit 0
}

# --- 1. Commit + push the source --------------------------------------------

function Invoke-CommitPush($path, $label) {
    Write-Step "Committing $label ($path)"
    & git -C $path add -A
    if ($LASTEXITCODE -ne 0) { throw "git add failed in $label" }

    & git -C $path diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Warn "Nothing to commit."
    } else {
        & git -C $path commit -m $Message
        if ($LASTEXITCODE -ne 0) { throw "git commit failed in $label" }
        Write-Ok "Committed."
    }

    if ($NoPush) { return }

    & git -C $path push
    if ($LASTEXITCODE -ne 0) { throw "git push failed in $label" }
    Write-Ok "Pushed."
}

Invoke-CommitPush $Source (Split-Path $Source -Leaf)

# --- 2. Mirror the files -----------------------------------------------------

Write-Step "Mirroring to $Target"
& robocopy @RoboArgs /NFL

# robocopy exit codes: 0-7 are success (8+ are real failures).
# Bit 0 = files copied, bit 1 = extra files deleted from the target.
$robo = $LASTEXITCODE
if ($robo -ge 8) { throw "robocopy failed with exit code $robo" }
if ($robo -eq 0) { Write-Ok "Target was already identical." }
else             { Write-Ok "Target updated (robocopy code $robo)." }

# --- 3. Commit + push the target --------------------------------------------

Invoke-CommitPush $Target (Split-Path $Target -Leaf)

Write-Step "Done"
if ($NoPush) {
    Write-Warn "Skipped pushing (-NoPush). Run 'git push' in both repos when ready."
} else {
    Write-Ok "Both repos are in sync and pushed. Live in ~1 min."
}
