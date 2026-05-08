-- VOSTOK LABS: MONO MONITOR PRESET
-- Version: 2.3.0
-- Context: MONO
reaper.gmem_attach("vostoklabs")

local UI = { bg={0.005,0.005,0.005,1}, green={0.22,1,0.08,1}, cyan={0,0.7,1,1}, red={1,0,0,1}, grid=0.03 }
local PRESETS = { {n="MASTERING", f="VostokHUD_Mastering.lua"}, {n="PHASE", f="VostokHUD_Phase.lua"}, {n="MONO", f="VostokHUD_Monitor.lua"} }

function DrawFooter()
    gfx.set(1,1,1,0.1); gfx.line(0, gfx.h-40, gfx.w, gfx.h-40)
    local w = gfx.w / #PRESETS
    for i, p in ipairs(PRESETS) do
        if p.n == "MONO" then gfx.set(UI.red[1], UI.red[2], UI.red[3], 0.2); gfx.rect((i-1)*w, gfx.h-40, w, 40) end
        gfx.set(1,1,1, p.n == "MONO" and 1 or 0.3); gfx.setfont(1, "JetBrains Mono", 10)
        local tw = gfx.measurestr(p.n); gfx.x, gfx.y = (i-1)*w+(w-tw)/2, gfx.h-25; gfx.drawstr(p.n)
    end
end

function DrawMonitor()
    local is_mono = reaper.GetMasterMuteSoloFlags() & 4 == 4 -- Master Mono Check (simplified)
    
    gfx.setfont(1, "JetBrains Mono", 24)
    gfx.set(is_mono and UI.red[1] or UI.green[1], is_mono and UI.red[2] or UI.green[2], is_mono and UI.red[3] or UI.green[3], 1)
    
    local txt = is_mono and "MONO MONITORING ACTIVE" or "STEREO MONITORING"
    local tw = gfx.measurestr(txt)
    gfx.x, gfx.y = (gfx.w-tw)/2, 120; gfx.drawstr(txt)
    
    -- Button
    gfx.set(1,1,1,0.1); gfx.rect(gfx.w/2-100, 200, 200, 60, 1)
    gfx.set(1,1,1,1); gfx.setfont(1, "JetBrains Mono", 16)
    local btn_txt = is_mono and "SWITCH TO STEREO" or "SWITCH TO MONO"
    local btw = gfx.measurestr(btn_txt)
    gfx.x, gfx.y = (gfx.w-btw)/2, 220; gfx.drawstr(btn_txt)
    
    if gfx.mouse_cap == 1 and gfx.mouse_y > 200 and gfx.mouse_y < 260 and gfx.mouse_x > gfx.w/2-100 and gfx.mouse_x < gfx.w/2+100 then
        -- Toggle Master Mono (requires action ID or Master_OnCommand)
        reaper.Main_OnCommand(40917, 0) -- Master track: Toggle mono
    end
end

function Main()
    gfx.set(UI.bg[1], UI.bg[2], UI.bg[3], 1); gfx.rect(0,0,gfx.w,gfx.h)
    for i=0,gfx.w,30 do gfx.set(1,1,1,UI.grid); gfx.line(i,0,i,gfx.h); gfx.line(0,i,gfx.w,i) end
    DrawMonitor(); DrawFooter()
    if gfx.getchar() ~= -1 then reaper.defer(Main) end
    gfx.update()
end
gfx.init("VOSTOK KERNEL [MONO]", 500, 400); Main()
