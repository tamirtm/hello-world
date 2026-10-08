-- Companion Exporter: metadata only. The work happens in the game script.
-- UNVERIFIED against Transport Fever 3: written from the TF2 mod layout.
function data()
    return {
        info = {
            minorVersion = 0,
            severityAdd = "NONE",
            severityRemove = "NONE",
            name = "Companion Exporter",
            description = "Prints game statistics as TFC| JSON lines for the Transport Fever companion app.",
            authors = { { name = "tamirtm", role = "CREATOR" } },
            tags = { "Misc" },
        },
    }
end
