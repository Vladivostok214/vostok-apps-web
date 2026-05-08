-- VOSTOK LABS: MASTERING SUITE PRESET
-- Version: 2.3.0
-- Context: MASTERING
reaper.gmem_attach("vostoklabs")

local UI = { bg={0.005,0.005,0.005,1}, green={0.22,1,0.08,1}, cyan={0,0.7,1,1}, grid=0.03 }
local PRESETS = { {n="MASTERING", f="VostokHUD_Mastering.lua"}, {n="PHASE", f="VostokHUD_Phase.lua"}, {n="MONO", f="VostokHUD_Monitor.lua"} }

function DrawFooter()
    gfx.set(1,1,1,0.1); gfx.line(0, gfx.h-40, gfx.w, gfx.h-40)
    local w = gfx.w / #PRESETS
    for i, p in ipairs(PRESETS) do
        if p.n == "MASTERING" then gfx.set(UI.green[1], UI.green[2], UI.green[3], 0.2); gfx.rect((i-1)*w, gfx.h-40, w, 40) end
        gfx.set(1,1,1, p.n == "MASTERING" and 1 or 0.3); gfx.setfont(1, "JetBrains Mono", 10)
        local tw = gfx.measurestr(p.n); gfx.x, gfx.y = (i-1)*w+(w-tw)/2, gfx.h-25; gfx.drawstr(p.n)
    end
end

function DrawChain()
    local chain = {"EQ NOIR", "DYNAMIC COMP", "STEREO WIDENER", "BRICKWALL LIMITER"}
    for i, name in ipairs(chain) do
        local y = 60 + (i-1)*50
        gfx.set(1,1,1,0.05); gfx.rect(30, y, gfx.w-60, 40, 1)
        gfx.set(UI.green[1], UI.green[2], UI.green[3], 1); gfx.circle(50, y+20, 4, 1)
        gfx.setfont(1, "JetBrains Mono", 14); gfx.x, gfx.y = 70, y+12; gfx.drawstr(name)
        gfx.set(1,1,1,0.1); gfx.rect(gfx.w-150, y+15, 100, 10); gfx.set(UI.cyan[1], UI.cyan[2], UI.cyan[3], 0.6); gfx.rect(gfx.w-150, y+15, 70, 10)
    end
end

function Main()
    gfx.set(UI.bg[1], UI.bg[2], UI.bg[3], 1); gfx.rect(0,0,gfx.w,gfx.h)
    for i=0,gfx.w,30 do gfx.set(1,1,1,UI.grid); gfx.line(i,0,i,gfx.h); gfx.line(0,i,gfx.w,i) end
    DrawChain(); DrawFooter()
    if gfx.mouse_cap == 1 and gfx.mouse_y > gfx.h-40 then 
        local idx = math.floor(gfx.mouse_x/(gfx.w/#PRESETS))+1
        reaper.Main_OnCommand(reaper.NamedCommandLookup("_RS" .. reaper.genGuid():gsub("-",""):sub(1,16)), 0) -- Placeholder for switch
    end
    if gfx.getchar() ~= -1 then reaper.defer(Main) end
    gfx.update()
end
gfx.init("VOSTOK KERNEL [MASTERING]", 500, 400); Main()
