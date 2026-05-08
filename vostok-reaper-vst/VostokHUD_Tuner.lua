-- VOSTOK LABS: META-KERNEL (TUNER PRESET)
-- Version: 2.2.0 (Context: TUNER)
-- Author: Vostok Labs Agent

reaper.gmem_attach("vostoklabs")

local UI = {
    bg = {0.005, 0.005, 0.005, 1},
    green = {0.22, 1, 0.08, 1},
    cyan = {0, 0.7, 1, 1},
    grid_alpha = 0.03
}

-- Definimos los Presets Disponibles (Nombres de archivos)
local PRESETS = {
    {name = "MASTERING", file = "VostokHUD_Mastering.lua"},
    {name = "TUNER", file = "VostokHUD_Tuner.lua"},
    {name = "ANALYTICS", file = "VostokHUD_Analytics.lua"}
}

function SwitchPreset(filename)
    -- Para que esto funcione, los scripts deben estar en la carpeta de Scripts de REAPER
    local cmd_id = reaper.AddRemoveReaScript(true, 0, reaper.GetResourcePath() .. "/Scripts/VostokLabs/" .. filename, true)
    if cmd_id ~= 0 then
        reaper.Main_OnCommand(cmd_id, 0)
        return true
    end
    return false
end

function DrawPresetSwitcher()
    gfx.set(1, 1, 1, 0.2)
    gfx.line(0, gfx.h - 40, gfx.w, gfx.h - 40)
    for i, p in ipairs(PRESETS) do
        local w = gfx.w / #PRESETS
        if p.name == "TUNER" then -- Resaltar el actual
            gfx.set(UI.cyan[1], UI.cyan[2], UI.cyan[3], 0.2)
            gfx.rect((i-1)*w, gfx.h - 40, w, 40)
            gfx.set(UI.cyan[1], UI.cyan[2], UI.cyan[3], 1)
        else
            gfx.set(1, 1, 1, 0.4)
        end
        gfx.setfont(1, "JetBrains Mono", 10)
        local tw = gfx.measurestr(p.name)
        gfx.x, gfx.y = (i-1)*w + (w-tw)/2, gfx.h - 25
        gfx.drawstr(p.name)
    end
end

function DrawTunerLogic()
    local freq = reaper.gmem_read(100)
    local mag = reaper.gmem_read(101)
    gfx.setfont(1, "JetBrains Mono", 60, 98)
    gfx.set(UI.green[1], UI.green[2], UI.green[3], mag > 0.01 and 1 or 0.2)
    gfx.x, gfx.y = 100, 100
    gfx.drawstr(mag > 0.01 and "A4" or "--") -- Simplificado para el Kernel
end

function Main()
    gfx.set(UI.bg[1], UI.bg[2], UI.bg[3], 1)
    gfx.rect(0, 0, gfx.w, gfx.h)
    
    -- Grid
    gfx.set(1, 1, 1, UI.grid_alpha)
    for i = 0, gfx.w, 30 do gfx.line(i, 0, i, gfx.h) end
    for i = 0, gfx.h, 30 do gfx.line(0, i, gfx.w, i) end
    
    DrawTunerLogic()
    DrawPresetSwitcher()
    
    -- Mouse Handling para Cambio de Script
    if gfx.mouse_cap == 1 and gfx.mouse_y > gfx.h - 40 then
        local idx = math.floor(gfx.mouse_x / (gfx.w / #PRESETS)) + 1
        -- Aquí llamaríamos a SwitchPreset(PRESETS[idx].file)
        -- reaper.ShowConsoleMsg("Cambiando a: " .. PRESETS[idx].name)
    end
    
    if gfx.getchar() ~= -1 then reaper.defer(Main) end
    gfx.update()
end

gfx.init("VOSTOK KERNEL [TUNER]", 500, 350)
Main()
