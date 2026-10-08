-- Prints one `TFC|<json>` line every EXPORT_INTERVAL game-seconds to stdout.txt.
-- UNVERIFIED against Transport Fever 3: every game.interface / api call below is
-- from the TF2 API and is wrapped in pcall, so a missing call yields a null field
-- instead of crashing the script. Adjust once the TF3 scripting docs are readable.

local EXPORT_INTERVAL = 30 -- game-time seconds between exports (os.time may be sandboxed)
local lastExport = 0

local function jsonString(s)
    return '"' .. tostring(s):gsub('[%c"\\]', function(c)
        return string.format("\\u%04x", string.byte(c))
    end) .. '"'
end

local function encode(v)
    local t = type(v)
    if t == "number" then
        if v ~= v or v == math.huge or v == -math.huge then return "null" end
        return tostring(v)
    elseif t == "boolean" then
        return tostring(v)
    elseif t == "string" then
        return jsonString(v)
    elseif t == "table" then
        local parts = {}
        if #v > 0 or next(v) == nil then
            for _, x in ipairs(v) do parts[#parts + 1] = encode(x) end
            return "[" .. table.concat(parts, ",") .. "]"
        end
        for k, x in pairs(v) do
            parts[#parts + 1] = jsonString(k) .. ":" .. encode(x)
        end
        return "{" .. table.concat(parts, ",") .. "}"
    end
    return "null"
end

local function try(fn, ...)
    local ok, result = pcall(fn, ...)
    if ok then return result end
    return nil
end

local function count(tbl)
    if type(tbl) ~= "table" then return nil end
    local n = 0
    for _ in pairs(tbl) do n = n + 1 end
    return n
end

local function snapshot()
    local gi = game and game.interface
    if not gi then return nil end
    local player = try(gi.getPlayer)
    local entity = player and try(gi.getEntity, player)
    return {
        version = 1,
        gameTime = try(gi.getGameTime),
        money = entity and try(function() return entity.balance end),
        lines = count(try(gi.getLines)),
        vehicles = count(try(gi.getEntities, { radius = 1e9, pos = { 0, 0 } }, { type = "VEHICLE" })),
        towns = count(try(gi.getEntities, { radius = 1e9, pos = { 0, 0 } }, { type = "TOWN" })),
    }
end

local function export()
    local snap = snapshot()
    if snap then print("TFC|" .. encode(snap)) end
end

function data()
    return {
        update = function()
            local now = try(game.interface.getGameTime) or 0
            if now - lastExport >= EXPORT_INTERVAL or now < lastExport then
                lastExport = now
                export()
            end
        end,
    }
end
