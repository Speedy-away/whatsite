EXPULSION LUA SCRIPTS - PS4 GTA 1.57

Install the updated LushModz-Expulsion-1.57.prx with GTA fully closed.
Copy MountMod.lua to:
/data/Expulsion/LUA-Scripts/MountMod.lua

In Expulsion:
Misc Options > LUA Scripts > Refresh / Search for .lua Scripts
Select MountMod.lua > Enable Script, then close Expulsion.

MountMod controls:
R1 + D-pad Down: show/hide MountMod menu.
D-pad Up/Down: select Cow, Deer or Mountain Lion.
X: activate selected option (spawns animal and mounts it).
Circle: hide MountMod menu.
While riding: left stick moves, hold X runs, Triangle dismounts/removes animal.
Stop the script from Expulsion to remove its animal and detach the rider.

The port rides animals spawned by this script; it does not mount nearby players.
The original keyboard GUI and indefinite wait loops are replaced by the PS4 API
and Expulsion's asynchronous animal-riding backend. MountMod by Ideo; PS4 port
for Expulsion. Original files retained under research/mountmod/original.

Browser:
Refresh rescans the folder. Running Scripts lists enabled scripts with Stop.
Each script has Enable, Reload and Stop. Maximum four active scripts.
Only .lua text files directly inside this folder are scanned; subfolders skipped.
File limit 64 KiB, 128 listed files, 2 MiB Lua memory per script.
Scripts start only when you enable them; no automatic startup.
Errors and instruction/memory budget failures stop the script and clean up its
owned animal. Existing native animal rides are not owned by the Lua script.

Compatibility:
This is embedded Lua 5.4.8 with Expulsion Lua API v1, not the old PC Lua plugin.
Other PC scripts must be ported; GAMEPLAY/AI/UI/Libs/Keys/wait are not provided.
A script returns a table with optional init(), tick(), stop() functions.
See API.md for the supported functions. Arbitrary native pointers are not exposed.

Local runtime, browser, controller and cleanup tests passed. Real PS4 behavior
has not been verified. Keep LUA-LICENSE.txt with redistributed builds.

LUSH MODZ FUN V1 MENU
Copy LushModzFunV1Menu.lua into the same LUA-Scripts folder. Requires the
updated PRX bundled with this release (rect/icon/fun Lua API extensions).
Enable it from Misc Options > LUA Scripts and close the main Expulsion menu.
L1 + D-pad Down: show/hide. Up/Down: select. X: activate. Circle: back/hide.
Left/Right: adjust. Square: cycle six palettes. Triangle: cycle three designs.
Includes Self Playground, Vehicle Arcade, World Mood, Animal Rides and
Design Studio. Appearance settings last until the script is reloaded.
Vehicle actions require the driver seat and network control. Launch/boost
power is adjustable. Weather/time are local requests; session scripts may
restore them. Hiding the menu does not stop a ride; Triangle dismounts.
Stopping/reloading the script removes only the animal ride it owns.
One-shot changes such as paint, clothing, time and weather remain applied.
Avoid operating multiple Lua menus at once because controller inputs are shared.
