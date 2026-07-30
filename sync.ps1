<#
.SYNOPSIS
    Mirrors whatsite -> whatwhatboy-site, then commits and pushes both repos.

.DESCRIPTION
    Both repos serve whatwhatboy.com and must stay byte-identical.
    Edit whatsite only; this script pushes those edits to the mirror.
    See SYNC.md for details.

.EXAMPLE
    .\sync.ps1 -Message "fix console filter"
.EXAMPLE
    .\sync.ps1 -DryRun
.EXAMPLE
    .\sync.ps1 -Message "tweak copy" -NoPush
#>
[CmdletBinding()]
param(
    # Commit message used for both repos. Required unless -DryRun.
    [string]$Message,

    # Show what would be copied, then exit. Touches nothing.
    [switch]$DryRun,

    # Copy and commit, but don't push.
    [switch]$NoPush,

    # Override the mirror location.
    [string]$MirrorPath
)

$ErrorActionPreference = 'Stop'

$Source = $PSScriptRoot
if (-not $MirrorPath) {
    $MirrorPath = Join-Path (Split-Path $Source -Parent) 'whatwhatboy-site'
}

# Not mirrored - see the "What is not synced" table in SYNC.md
$ExcludeDirs  = @('.git', '.claude')
$ExcludeFiles = @('sync.ps1', 'SYNC.md')

function Write-Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }
function Write-Ok($text)   { Write-Host "    $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "    $text" -ForegroundColor Yellow }

# --- Preflight ---------------------------------------------------------------

if (-not (Test-Path (Join-Path $Source '.git'))) {
    throw "Source is not a git repo: $Source"
}
if (-not (Test-Path $MirrorPath)) {
    throw "Mirror not found: $MirrorPath`nClone it first, or pass -MirrorPath."
}
if (-not (Test-Path (Join-Path $MirrorPath '.git'))) {
    throw "Mirror is not a git repo: $MirrorPath"
}
if (-not $DryRun -and -not $Message) {
    throw "-Message is required (or use -DryRun to preview)."
}

# robocopy args shared by the dry run and the real run
$RoboArgs = @($Source, $MirrorPath, '/MIR', '/NJH', '/NJS', '/NP', '/NDL',
              '/XD') + $ExcludeDirs + @('/XF') + $ExcludeFiles

# --- Dry run -----------------------------------------------------------------

if ($DryRun) {
    Write-Step "Dry run - files that would change in the mirror"
    # /L lists without copying; /NDL drops directory headers so only files show.
    & robocopy @RoboArgs /L
    $code = $LASTEXITCODE
    if ($code -eq 0) {
        Write-Ok "Already in sync. Nothing to copy."
    } elseif ($code -ge 8) {
        throw "robocopy failed with exit code $code"
    } else {
        Write-Warn "Files listed above would be copied or deleted. Re-run with -Message to apply."
    }
    exit 0
}

# --- 1. Commit + push the primary -------------------------------------------

Write-Step "Committing primary ($Source)"
Push-Location $Source
try {
    & git add -A
    if ($LASTEXITCODE -ne 0) { throw "git add failed in primary" }

    & git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Warn "No changes to commit."
    } else {
        & git commit -m $Message
        if ($LASTEXITCODE -ne 0) { throw "git commit failed in primary" }
        Write-Ok "Committed."
    }

    if (-not $NoPush) {
        & git push
        if ($LASTEXITCODE -ne 0) { throw "git push failed in primary" }
        Write-Ok "Pushed."
    }
} finally {
    Pop-Location
}

# --- 2. Mirror the files -----------------------------------------------------

Write-Step "Mirroring to $MirrorPath"
& robocopy @RoboArgs /NFL

# robocopy exit codes: 0-7 are success (8+ are real failures).
# Bit 0 = files copied, bit 1 = extra files deleted from the mirror.
$robo = $LASTEXITCODE
if ($robo -ge 8) {
    throw "robocopy failed with exit code $robo"
}
if ($robo -eq 0) {
    Write-Ok "Mirror was already identical."
} else {
    Write-Ok "Mirror updated (robocopy code $robo)."
}

# --- 3. Commit + push the mirror --------------------------------------------

Write-Step "Committing mirror ($MirrorPath)"
Push-Location $MirrorPath
try {
    & git add -A
    if ($LASTEXITCODE -ne 0) { throw "git add failed in mirror" }

    & git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Warn "Mirror already up to date, nothing to commit."
    } else {
        & git commit -m $Message
        if ($LASTEXITCODE -ne 0) { throw "git commit failed in mirror" }
        Write-Ok "Committed."

        if (-not $NoPush) {
            & git push
            if ($LASTEXITCODE -ne 0) { throw "git push failed in mirror" }
            Write-Ok "Pushed."
        }
    }
} finally {
    Pop-Location
}

Write-Step "Done"
if ($NoPush) {
    Write-Warn "Skipped pushing (-NoPush). Run 'git push' in both repos when ready."
} else {
    Write-Ok "Both repos are in sync and pushed. Live in ~1 min."
}
