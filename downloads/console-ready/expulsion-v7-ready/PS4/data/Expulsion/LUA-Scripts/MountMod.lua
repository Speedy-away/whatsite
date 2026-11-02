-- Mount Mod by Ideo. PS4 port for Expulsion Lua API v1.
-- Original PC archive retained in research/mountmod/original.
-- Enable in Misc Options > LUA Scripts, then close Expulsion.
-- R1 + D-pad Down: show/hide. D-pad: select. X: activate. Circle: hide.
-- Riding: left stick move, hold X run, Triangle dismount.
local api = assert(expulsion, 'Requires Expulsion Lua API v1')
local visible, selected = true, 1
local entries = {
    { 'Cow', 'cow' },
    { 'Deer', 'deer' },
    { 'Mountain Lion', 'mountain_lion' },
    { 'Dismount / Remove Animal' },
    { 'Hide Mount Menu' }
}
local function tick()
    if api.menu_open() then return end
    if api.held('r1') and api.pressed('down') then
        api.disable('r1')
        api.disable('down')
        visible = not visible
        return
    end
    if not visible then return end
    for _, button in ipairs({'up','down','cross','circle','r1'}) do
        api.disable(button)
    end
    if api.pressed('circle') then visible = false; return end
    if api.pressed('up') then selected = (selected - 2) % #entries + 1 end
    if api.pressed('down') then selected = selected % #entries + 1 end
    if api.pressed('cross') then
        if selected <= 3 then
            if api.mount_start(entries[selected][2]) then visible = false end
        elseif selected == 4 then
            api.mount_stop()
        else
            visible = false
        end
    end
    if not visible then return end
    api.text('MOUNT MOD - PS4', 0.06, 0.16, 0.48, true)
    for i, entry in ipairs(entries) do
        api.text((selected == i and '> ' or '  ') .. entry[1],
                 0.06, 0.22 + (i - 1) * 0.038, 0.34, selected == i)
    end
    api.text('D-pad: Select | X: Activate | Circle: Hide', 0.06, 0.44, 0.27)
    api.text('R1 + D-pad Down: Open / Close', 0.06, 0.48, 0.27)
end
return {
    init = function()
        api.notify('MountMod enabled. Close Expulsion; R1 + D-pad Down opens MountMod.')
    end,
    tick = tick,
    stop = function() api.mount_stop() end
}
