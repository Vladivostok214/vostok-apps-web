-- VOSTOK LABS: PHASE ANALYZER PRESET
-- Version: 2.3.0
-- Context: PHASE
reaper.gmem_attach("vostoklabs")

local UI = { bg={0.005,0.005,0.005,1}, green={0.22,1,0.08,1}, cyan={0,0.7,1,1}, grid=0.03 }
local PRESETS = { {n="MASTERING", f="VostokHUD_Mastering.lua"}, {n="PHASE", f="VostokHUD_Phase.lua"}, {n="MONO", f="VostokHUD_Monitor.lua"} }

function DrawFooter()
    gfx.set(1,1,1,0.1); gfx.line(0, gfx.h-40, gfx.w, gfx.h-40)
    local w = gfx.w / #PRESETS
    for i, p in ipairs(PRESETS) do
        if p.n == "PHASE" then gfx.set(UI.cyan[1], UI.cyan[2], UI.cyan[3], 0.2); gfx.rect((i-1)*w, gfx.h-40, w, 40) end
        gfx.set(1,1,1, p.n == "PHASE" and 1 or 0.3); gfx.setfont(1, "JetBrains Mono", 10)
        local tw = gfx.measurestr(p.n); gfx.x, gfx.y = (i-1)*w+(w-tw)/2, gfx.h-25; gfx.drawstr(p.n)
    end
end

function DrawPhase()
    local cx, cy = gfx.w/2, 180
    gfx.set(1,1,1,0.1); gfx.circle(cx, cy, 100, 0); gfx.line(cx-120, cy, cx+120, cy); gfx.line(cx, cy-120, cx, cy+120)
    
    -- Correlation Meter (Mock)
    gfx.setfont(1, "JetBrains Mono", 12); gfx.x, gfx.y = cx-120, cy+130; gfx.drawstr("-1 (OUT)")
    gfx.x, gfx.y = cx+80, cy+130; gfx.drawstr("+1 (IN)")
    gfx.set(UI.green[1], UI.green[2], UI.green[3], 1)
    gfx.rect(cx-50, cy+145, 100, 5, 0); gfx.rect(cx+20, cy+145, 10, 5, 1) -- Needle
    
    -- Lissajous (Simulated)
    gfx.set(UI.cyan[1], UI.cyan[2], UI.cyan[3], 0.6)
    for i=1, 50 do
        local rx, ry = math.random(-80, 80), math.random(-80, 80)
        gfx.circle(cx+rx, cy+ry, 1, 1)
    end
end

function Main()
    gfx.set(UI.bg[1], UI.bg[2], UI.bg[3], 1); gfx.rect(0,0,gfx.w,gfx.h)
    for i=0,gfx.w,30 do gfx.set(1,1,1,UI.grid); gfx.line(i,0,i,gfx.h); gfx.line(0,i,gfx.w,i) end
    DrawPhase(); DrawFooter()
    if gfx.getchar() ~= -1 then reaper.defer(Main) end
    gfx.update()
end
gfx.init("VOSTOK KERNEL [PHASE]", 500, 400); Main()
