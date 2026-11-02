# Expulsion Lua API v1

Embedded Lua 5.4.8. Put UTF-8/ASCII `.lua` text files directly in
`/data/Expulsion/LUA-Scripts` and enable them in **Misc Options > LUA Scripts**.
Save without a UTF-8 BOM. Return a callback table:

```lua
return {
    init = function() expulsion.notify('Example enabled') end,
    tick = function()
        if expulsion.menu_open() then return end
        if expulsion.pressed('square') then expulsion.notify('Square pressed') end
    end,
    stop = function() end
}
```

`init` runs once, `tick` runs on the GTA menu-hook thread each game tick, and
`stop` runs when manually stopping/reloading/unloading. All are optional and
captured when the script is loaded. Lua errors stop the script. On an error,
the host performs resource cleanup without calling potentially failing Lua
cleanup code. Do short work per tick; there is no blocking `wait` function.
Use `time_ms()` for nonblocking timers. Do not depend on wall-clock time.

| Function | Behavior |
| --- | --- |
| `expulsion.api_version` | Integer `1` |
| `expulsion.notify(text)` | Notification, maximum 160 bytes |
| `expulsion.time_ms()` | GTA game timer; wraps as an unsigned 32-bit counter |
| `expulsion.menu_open()` | True while Expulsion or its keyboard is open |
| `expulsion.pressed(button)` | Button's just-pressed edge; false while Expulsion is open |
| `expulsion.held(button)` | Held state; false while Expulsion is open |
| `expulsion.disable(button)` | Suppress normal game action this frame, while Expulsion is closed |
| `expulsion.text(text,x,y,scale,selected)` | Text at normalized screen coordinates; scale 0.1-0.7, default 0.32; selected optional |
| `expulsion.mount_start(animal)` | Request a local animal ride; returns request acceptance, not loading completion |
| `expulsion.mount_state()` | `0` inactive, `1` loading, `2` mounted, for this script's owned ride |
| `expulsion.mount_stop()` | Dismount/delete only this script's owned animal |

Button names: `up`, `down`, `left`, `right`, `cross`, `circle`, `triangle`,
`square`, `l1`, `r1`. Direction/accept/cancel use frontend mappings. Riding
uses native left-stick input, sprint (X) and enter/exit (Triangle) mappings.
Button suppression belongs in `tick`, before testing the disabled input.
Only run your UI input/drawing when `menu_open()` is false.

Animal names: `cow`, `deer`, `mountain_lion`, `boar`, `pig`, `husky`.
One animal ride is shared by Expulsion; another script/native ride cannot be
taken over. Model/animation availability checks and timeout run asynchronously.
A later manually started native ride is not removed by stopping an older Lua script.

Standard base/table/string/math/utf8 operations are available. Files, OS,
package loading, debug, coroutine libraries, `load`, `loadfile`, `dofile`,
`collectgarbage`, `pcall`, `xpcall` and metatable access are unavailable. Scripts
are text-only; PC plugin APIs and Lua binary chunks are unsupported.
Each script has an isolated Lua state and a 2 MiB allocation cap. Startup/init
allow 200,000 instructions, tick 50,000, stop 20,000; hooks check every 500.
Host calls are capped at 128 per callback. C nesting is limited to 50.
These bounds stop runaway Lua code; they are not a real-time guarantee for
arbitrary standard-library C work or game-native calls.

Runtime source: `source/lua_runtime157.c`. Native bridge/browser:
`include/lua_scripts157.h`. Vendor: [Lua 5.4.8 official source](https://www.lua.org/ftp/lua-5.4.8.tar.gz),
SHA-256 `4f18ddae154e793e46eeab727c59ef1c0c0c2b744e7b94219710d76f530629ae`.
Lua source is unmodified. The PS4 build maps the SDK's errno declaration to
SceLibcInternal `_Errno` and uses `LUAI_MAXCCALLS=50`.
See [Lua's embedding API reference](https://www.lua.org/manual/5.4/manual.html#4).
License: `LUA-LICENSE.txt`.

## Fun menu drawing and actions

- `expulsion.rect(x, y, width, height, red, green, blue, alpha)` draws a rectangle. Coordinates/dimensions must be finite 0..1, colors integer 0..255.
- `expulsion.icon(index, x, y, size, red, green, blue)` draws one of eight commonmenu sprites; index 0..7, size 0..0.1. Texture loading is asynchronous.
- `expulsion.fun(action, value=0)` performs one bounded local action and returns success; integer action 0..16 and value 0..100.

Actions: 0 health/armour, 1 clean, 2 wet, 3 on-foot launch, 4 turn around, 5 random clothing, 6 vehicle repair/clean, 7 vehicle paint roulette, 8 vehicle hop, 9 forward boost, 10 right vehicle, 11 noon, 12 midnight, 13 evening, 14 sun, 15 thunder, 16 snow. Launch/hop/boost use value as power. Vehicle actions require the local driver and network control; all actions require a living local ped and closed Expulsion menu. No arbitrary native invocation or entity pointers are exposed. One-shot changes are not undone on script stop.

These are additive API v1 extensions: scripts should check the required functions exist.
