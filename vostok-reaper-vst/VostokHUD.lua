-- VOSTOK LABS: COMMAND DECK KERNEL
-- Version: 3.2.0 (Tap Tempo Edition)
-- Author: Vostok Labs Agent

local UI = {
    bg = {0.005, 0.005, 0.005, 1},
    green = {0.22, 1, 0.08, 1},
    cyan = {0, 0.7, 1, 1},
    grid = 0.03
}

-- Obtener la ruta de la carpeta actual del script
local script_path = debug.getinfo(1,'S').source:match([[^@?(.*[\/])]])

-- TAP TEMPO LOGIC
local tap_times = {}
function ProcessTap()
    local now = reaper.time_precise()
    
    -- Limpiar taps antiguos (más de 2 segundos)
    if #tap_times > 0 and now - tap_times[#tap_times] > 2 then
        tap_times = {}
    end
    
    table.insert(tap_times, now)
    
    if #tap_times >= 2 then
        local sum = 0
        for i = 2, #tap_times do
            sum = sum + (tap_times[i] - tap_times[i-1])
        end
        local avg_interval = sum / (#tap_times - 1)
        local bpm = 60 / avg_interval
        
        -- Limitar BPM razonable
        if bpm >= 40 and bpm <= 300 then
            reaper.CSurf_OnTempoChange(bpm)
        end
    end
end

local DECK = {
    {label = "PHASE",   cmd = "VostokHUD_Phase.lua"},
    {label = "TAP TEMPO", cmd = "TAP"}, -- Comando especial para el Tap           
    {label = "MIXER",   cmd = "40075"}, 
    {label = "MONO",    cmd = "40917"},           
    {label = "CLEANUP", cmd = "40062"},           
    {label = "RENDER",  cmd = "40015"},           
    {label = "MASTERING", cmd = "VostokHUD_Mastering.lua"},
    {label = "METRONOME", cmd = "40364"}, 
    {label = "GRID",      cmd = "40145"}, 
}

local flash_timer = 0
local active_btn = -1

function Init()
    gfx.init("VOSTOK COMMAND DECK", 600, 400)
end

function DrawGrid()
    gfx.set(1, 1, 1, UI.grid)
    for i = 0, gfx.w, 40 do gfx.line(i, 0, i, gfx.h) end
    for i = 0, gfx.h, 40 do gfx.line(0, i, gfx.w, i) end
end

function ExecuteCommand(cmd, idx)
    active_btn = idx
    flash_timer = 10 
    
    if cmd == "TAP" then
        ProcessTap()
        return
    end
    
    if type(cmd) == "string" and cmd:match("%.lua$") then
        local full_path = script_path .. cmd
        local cmd_id = reaper.AddRemoveReaScript(true, 0, full_path, true)
        if cmd_id and cmd_id ~= 0 then 
            reaper.Main_OnCommand(cmd_id, 0) 
        else
            reaper.ShowConsoleMsg("ERROR: No se encontró " .. full_path .. "\n")
        end
    else
        local action_id = tonumber(cmd) or reaper.NamedCommandLookup(cmd)
        if action_id and action_id ~= 0 then
            reaper.Main_OnCommand(action_id, 0)
        end
    end
end

function DrawButtons()
    local cols = 3
    local padding = 20
    local btn_w = (gfx.w - (padding * (cols + 1))) / cols
    local btn_h = 80
    
    gfx.setfont(1, "JetBrains Mono", 16)
    
    for i, btn in ipairs(DECK) do
        local col = (i - 1) % cols
        local row = math.floor((i - 1) / cols)
        local x = padding + (col * (btn_w + padding))
        local y = 60 + (row * (btn_h + padding))
        
        local hover = gfx.mouse_x > x and gfx.mouse_x < x + btn_w and gfx.mouse_y > y and gfx.mouse_y < y + btn_h
        
        -- Renderizado Dinámico
        if active_btn == i and flash_timer > 0 then
            gfx.set(UI.cyan[1], UI.cyan[2], UI.cyan[3], flash_timer / 10)
            gfx.rect(x, y, btn_w, btn_h, 1)
            flash_timer = flash_timer - 1
        elseif hover then
            gfx.set(UI.green[1], UI.green[2], UI.green[3], 0.2)
            gfx.rect(x, y, btn_w, btn_h, 1)
            if gfx.mouse_cap == 1 and not clicked then
                ExecuteCommand(btn.cmd, i)
                clicked = true
            end
        else
            gfx.set(1, 1, 1, 0.05)
            gfx.rect(x, y, btn_w, btn_h, 1)
        end
        
        if not (gfx.mouse_cap == 1) then clicked = false end

        -- Borde y Texto
        gfx.set(1, 1, 1, hover and 0.8 or 0.2)
        gfx.rect(x, y, btn_w, btn_h, 0)
        
        -- Especial para TAP TEMPO: Mostrar BPM actual debajo del texto
        if btn.cmd == "TAP" then
            gfx.setfont(1, "JetBrains Mono", 14)
            local bpm = string.format("%.1f", reaper.Master_GetTempo())
            local tw_bpm = gfx.measurestr(bpm)
            gfx.x, gfx.y = x + (btn_w - tw_bpm)/2, y + (btn_h/2) + 5
            gfx.drawstr(bpm)
            
            gfx.setfont(1, "JetBrains Mono", 12)
            local tw_lbl = gfx.measurestr(btn.label)
            gfx.x, gfx.y = x + (btn_w - tw_lbl)/2, y + (btn_h/2) - 15
            gfx.drawstr(btn.label)
        else
            local tw = gfx.measurestr(btn.label)
            gfx.x, gfx.y = x + (btn_w - tw)/2, y + (btn_h - 14)/2
            gfx.drawstr(btn.label)
        end
    end
end

function Main()
    gfx.set(UI.bg[1], UI.bg[2], UI.bg[3], 1)
    gfx.rect(0, 0, gfx.w, gfx.h)
    DrawGrid()
    
    -- Header con BPM Global
    gfx.set(UI.green[1], UI.green[2], UI.green[3], 0.8)
    gfx.setfont(1, "JetBrains Mono", 12)
    gfx.x, gfx.y = 20, 20
    local cur_bpm = string.format("%.2f", reaper.Master_GetTempo())
    gfx.drawstr("VOSTOK COMMAND DECK // NOIR-TECH OS // MASTER BPM: " .. cur_bpm)
    gfx.line(0, 45, gfx.w, 45)
    
    DrawButtons()
    DrawScanlines()
    
    if gfx.getchar() ~= -1 then reaper.defer(Main) end
    gfx.update()
end

function DrawScanlines()
    gfx.set(0, 0, 0, 0.1)
    for i = 0, gfx.h, 4 do gfx.rect(0, i, gfx.w, 2) end
end

Init(); Main()
