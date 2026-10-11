# Converts a BG Stats export (BGStatsExport.json) into data/council.json for the site.
#
#   powershell -ExecutionPolicy Bypass -File tools\import-bgstats.ps1 -Export "C:\Users\sem_m\Downloads\BGStatsExport.json"
#
# Keeps only Twilight Imperium plays where players have a faction (the BG Stats "role" field).
# Free-text comments are private notes and are not published.
param(
  [Parameter(Mandatory = $true)][string]$Export,
  [string]$Out = '',
  [int]$BggId = 233078
)
$ErrorActionPreference = 'Stop'
# $PSScriptRoot is not available inside param() defaults in Windows PowerShell 5.1.
if (-not $Out) { $Out = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..\data\council.json' }
$utf8 = New-Object System.Text.UTF8Encoding $false

$j = [IO.File]::ReadAllText((Resolve-Path $Export), $utf8) | ConvertFrom-Json
$game = $j.games | Where-Object { $_.bggId -eq $BggId } | Select-Object -First 1
if (-not $game) { throw "No game with BGG id $BggId in the export." }

$players = @{}; $j.players | ForEach-Object { $players[[int]$_.id] = $_.name }
$locations = @{}; $j.locations | ForEach-Object { $locations[[int]$_.id] = $_.name }
$games = @{}; $j.games | ForEach-Object { $games[[int]$_.id] = $_.name }

# "Twilight Imperium: Fourth Edition - Prophecy of Kings" -> "PoK"; Codex volumes -> "Codex I" etc.
function Short-Expansion([string]$name) {
  $n = ($name -split '\s+[\u2013-]\s+', 2)[-1]
  if ($n -match 'Prophecy of Kings') { return 'PoK' }
  if ($n -match 'Codex Volume (\w+)') { return 'Codex ' + $Matches[1] }
  $n
}

$plays = @()
foreach ($p in ($j.plays | Where-Object { $_.gameRefId -eq $game.id -and -not $_.ignored } | Sort-Object playDate)) {
  $seats = @($p.playerScores)
  if (-not ($seats | Where-Object { $_.role })) { continue }
  $plays += [ordered]@{
    id         = $p.uuid
    date       = $p.playDate.Substring(0, 10)
    time       = $p.playDate.Substring(11, 5)
    minutes    = $(if ($p.durationMin -gt 0) { [int]$p.durationMin } else { $null })
    rounds     = $(if ($p.rounds -gt 0) { [int]$p.rounds } else { $null })
    location   = $locations[[int]$p.locationRefId]
    # "Map: Milty Draft / Factions: All Pick / Total War" -> one entry per part
    setup      = @(([string]$p.board) -split '\s*[\uFF0F/]\s*' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    expansions = @($p.expansionPlays | ForEach-Object { Short-Expansion $games[[int]$_.gameRefId] } | Sort-Object)
    seats      = @($seats | ForEach-Object {
      $vp = 0
      [ordered]@{
        player  = $players[[int]$_.playerRefId]
        faction = $_.role.Trim()
        vp      = $(if ([int]::TryParse([string]$_.score, [ref]$vp)) { $vp } else { $null })
        win     = [bool]$_.winner
        speaker = [bool]$_.startPlayer
      }
    })
  }
}

$data = [ordered]@{
  generated = (Get-Date).ToString('yyyy-MM-dd HH:mm')
  game      = $game.name
  plays     = $plays
}
New-Item -ItemType Directory -Force (Split-Path $Out) | Out-Null
[IO.File]::WriteAllText($Out, (ConvertTo-Json -InputObject $data -Depth 8 -Compress), $utf8)
"Wrote {0} sessions to {1}" -f $plays.Count, (Resolve-Path $Out)
