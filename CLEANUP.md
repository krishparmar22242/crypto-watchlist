# Cleanup

This file lists what this project created and gives safe removal steps. Nothing
here has been deleted by me. Run the commands yourself and stop at any step you
want to keep.

Checked on this Windows machine on 2026-11-13.

## Important facts before deleting

- `G:\Brokers` already existed before this project. Do not delete the
  `G:\Brokers` folder itself; remove only the contents listed below.
- Node.js was used as a portable copy inside `G:\Brokers\node`. No Node
  installer was used and no PATH/system environment variable was changed.
- No npm package was installed globally. `G:\Brokers\npm-global` is empty.
- The app's source, build output, and local Git history are all inside
  `G:\Brokers\projects\crypto-watchlist`.
- A private GitHub repository was created:
  `https://github.com/krishparmar22242/crypto-watchlist`.
- The existing `%APPDATA%\npm` folder and its global packages are unrelated to
  this project. Do not delete it.
- `%LOCALAPPDATA%\npm-cache` existed before this project. Do not delete the
  whole folder; only remove the project-specific log files listed below.
- `%USERPROFILE%\.git-credentials` is your saved Git/GitHub credential store.
  This project did not create it as an app cache, and deleting it can remove
  saved credentials for other repositories. Leave it alone.

## Existence report

| Path or item | Exists now? | Notes |
| --- | --- | --- |
| `G:\Brokers\node` | Yes | Portable Node.js 26.13.1. |
| `G:\Brokers\npm-cache` | Yes | Cache used by npm/npx. |
| `G:\Brokers\npm-global` | Yes | Empty. No global packages installed. |
| `G:\Brokers\projects\crypto-watchlist` | Yes | The app and its `.git` folder. |
| `G:\Brokers\tmp` | Yes | Node ZIP/extraction, Metro cache, Expo logs, and other temporary data. |
| `G:\Brokers\activate.ps1` | Yes | Session-only activation script. |
| `G:\Brokers\projects` | Yes | Contains only this project. |
| `C:\Users\krish\.expo` | Yes | Created 2026-11-13 12:12; Expo CLI caches/state. |
| `C:\Users\krish\.cache\expo-doctor` | No | Not present. |
| `C:\Users\krish\.cache\expo` | No | Not present. |
| `C:\Users\krish\AppData\Local\expo` | No | Not present. |
| `C:\Users\krish\AppData\Local\Temp` | Checked | No Expo/npm/Metro project leftovers found at the top level. |
| `C:\Users\krish\AppData\Local\npm-cache` | Yes | Pre-existing npm cache, not fully created by this project. |
| `C:\Users\krish\AppData\Local\npm-cache\_logs` | Yes | Contains five project-related debug logs listed below. |
| `C:\Users\krish\AppData\Roaming\npm` | Yes | Pre-existing global npm tools. Do not delete. |
| `C:\Users\krish\AppData\Roaming\npm-cache` | No | Not present. |
| `C:\Users\krish\.npm` | No | Not present. |
| `C:\Users\krish\.git-credentials` | Yes | Pre-existing credential store. Do not delete. |
| Windows Firewall rules for `G:\brokers\node\node.exe` | Yes | Two inbound Allow rules: one TCP and one UDP. |
| GitHub repository | Yes | Private repository; delete separately if you want it gone. |

The five npm log files that mention this project are:

```text
C:\Users\krish\AppData\Local\npm-cache\_logs\2026-11-13T06_34_13_379Z-debug-0.log
C:\Users\krish\AppData\Local\npm-cache\_logs\2026-11-13T06_44_11_018Z-debug-0.log
C:\Users\krish\AppData\Local\npm-cache\_logs\2026-11-13T06_54_10_714Z-debug-0.log
C:\Users\krish\AppData\Local\npm-cache\_logs\2026-11-13T07_04_10_257Z-debug-0.log
C:\Users\krish\AppData\Local\npm-cache\_logs\2026-11-13T07_14_09_766Z-debug-0.log
```

They appear to be small logs from background npm commands that ran while the
sandbox was active. Removing these files is safe; removing the parent npm cache
is not necessary.

## Step-by-step cleanup

### 1. Stop the app and Metro

Close Expo Go's connection or press `Ctrl+C` in the terminal running Expo.
Close any PowerShell window that was used for this project.

Check for leftover Node processes from the sandbox:

```powershell
Get-CimInstance Win32_Process |
  Where-Object { $_.ExecutablePath -like 'G:\Brokers\node\*' } |
  Select-Object ProcessId, Name, ExecutablePath
```

If any are listed, close the terminal that started them. Do not kill unrelated
Node processes from your other projects.

### 2. Delete the private GitHub repository (optional)

Keep this repository if you want it as a portfolio project.

To remove it completely:

1. Open `https://github.com/krishparmar22242/crypto-watchlist/settings`.
2. Scroll to **Danger Zone**.
3. Choose **Delete this repository** and follow GitHub's confirmation steps.

Doing this removes the remote copy, but it does not remove anything on this PC.

### 3. Remove the Windows Firewall rules (optional, requires Administrator)

The phone needed to reach Metro over the local network, so Windows created two
inbound rules for the portable Node executable. Removing the folder will leave
these rules pointing to a missing program. If you want to remove them too, open
**PowerShell as Administrator** and run:

```powershell
$program = 'G:\brokers\node\node.exe'
$rules = Get-NetFirewallApplicationFilter -PolicyStore ActiveStore |
  Where-Object { $_.Program -ieq $program } |
  ForEach-Object { Get-NetFirewallRule -Name $_.InstanceID }

$rules | Remove-NetFirewallRule
```

Verify that the sandbox-specific rules are gone:

```powershell
Get-NetFirewallApplicationFilter -PolicyStore ActiveStore |
  Where-Object { $_.Program -ieq 'G:\brokers\node\node.exe' }
```

No output means they are gone.

Do not remove the older Node.js firewall rules for `F:\nodejs\node.exe` or
`C:\Program Files\nodejs\node.exe`. Those installations existed before this
project.

### 4. Remove the Expo CLI cache outside the sandbox (optional)

`C:\Users\krish\.expo` was created during this setup. It contains Expo caches
and state, not your app source. If you do not use Expo for any other project,
remove it with:

```powershell
if (Test-Path -LiteralPath "$env:USERPROFILE\.expo") {
  Remove-Item -LiteralPath "$env:USERPROFILE\.expo" -Recurse -Force
}
```

The other common Expo cache locations were checked and are not present:

```text
C:\Users\krish\.cache\expo-doctor
C:\Users\krish\.cache\expo
C:\Users\krish\AppData\Local\expo
```

If you use Expo again later, it will recreate its own cache.

### 5. Remove only the project-related npm logs (optional)

This keeps the shared npm cache intact:

```powershell
$logDirectory = Join-Path $env:LOCALAPPDATA 'npm-cache\_logs'

if (Test-Path -LiteralPath $logDirectory) {
  Get-ChildItem -LiteralPath $logDirectory -Filter '*-debug-0.log' -File |
    Where-Object {
      Select-String -LiteralPath $_.FullName -Pattern 'crypto-watchlist|G:\\Brokers' -Quiet
    } |
    Remove-Item -Force
}
```

Do not delete all of `C:\Users\krish\AppData\Local\npm-cache`; other projects
use it.

No project-specific Expo/npm/Metro folders were found in
`C:\Users\krish\AppData\Local\Temp`. If you ran npm or Expo later without the
activation script, check again for new temporary files before removing them.

### 6. Remove the sandbox contents

Delete the known project folders and activation script. The parent
`G:\Brokers` folder was pre-existing and should remain.

```powershell
$targets = @(
  'G:\Brokers\projects\crypto-watchlist',
  'G:\Brokers\node',
  'G:\Brokers\npm-cache',
  'G:\Brokers\npm-global',
  'G:\Brokers\tmp',
  'G:\Brokers\activate.ps1'
)

foreach ($target in $targets) {
  if (Test-Path -LiteralPath $target) {
    Remove-Item -LiteralPath $target -Recurse -Force
  }
}

# Remove the projects container only if it is now empty.
if ((Test-Path -LiteralPath 'G:\Brokers\projects') -and
    -not (Get-ChildItem -LiteralPath 'G:\Brokers\projects' -Force)) {
  Remove-Item -LiteralPath 'G:\Brokers\projects' -Force
}
```

This removes:

- The React Native app and its local `.git` history.
- `dist/`, `node_modules/`, and the project's `.expo/` folder.
- The portable Node.js copy.
- npm/npx cache data created inside the sandbox.
- The downloaded Node ZIP and extracted files in `tmp`.
- The Metro cache, Expo logs, and other temporary files under `tmp`.
- The session activation script.

### 7. Verify the cleanup

```powershell
# These should return False.
Test-Path -LiteralPath 'G:\Brokers\projects\crypto-watchlist'
Test-Path -LiteralPath 'G:\Brokers\node'
Test-Path -LiteralPath 'G:\Brokers\npm-cache'
Test-Path -LiteralPath 'G:\Brokers\npm-global'
Test-Path -LiteralPath 'G:\Brokers\tmp'
Test-Path -LiteralPath 'G:\Brokers\activate.ps1'
Test-Path -LiteralPath "$env:USERPROFILE\.expo"

# G:\Brokers itself should still exist.
Test-Path -LiteralPath 'G:\Brokers'
```

No PATH or `setx` changes were made, so there is no PATH cleanup step.

### 8. Phone-side data (optional)

Expo Go keeps app data on the phone, including the saved favorite ids. To remove
the local app data, use Expo Go's project/recent-project controls or clear Expo
Go's storage, or uninstall Expo Go if you installed it only for this project.
This does not affect anything on the Windows laptop.
