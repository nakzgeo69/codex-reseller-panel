gg.setVisible(false)

local maphack_file = gg.EXT_CACHE_DIR .. "/maphack_status.txt"

local function get_status(file)
    local f = io.open(file, "r")
    if f then
        local content = f:read("*a"); f:close()
        if content == "ON" then return true end
    end
    return false
end

local function save_status(file, is_on)
    local f = io.open(file, "w")
    if f then
        if is_on then f:write("ON") else f:write("OFF") end
        f:close()
    end
end
function Apply_Maphack()
    gg.toast("Injecting Maphack...")
    gg.setRanges(gg.REGION_ANONYMOUS)
    gg.clearResults()
    gg.searchNumber("98,784,247,822;47,244,640,279;4,510,805,388,492,275,723:9", gg.TYPE_QWORD)
    if gg.getResultCount() == 0 then
        gg.toast("MAPHACK NOT FOUND."); gg.clearResults(); return false
    end
    gg.refineNumber("98,784,247,822", gg.TYPE_QWORD)
    local res = gg.getResults(99999) 
    if res and #res > 0 then
        for _, v in ipairs(res) do v.value = "98,784,247,823"; v.freeze = true end
        gg.setValues(res); gg.addListItems(res); gg.clearResults()
        save_status(maphack_file, true)
        gg.toast("MAPHACK SUCCESSFULLY INJECTED")
        return true
    else
        gg.toast("REFINE FAILED"); gg.clearResults(); return false
    end
end

function Off_Maphack_Only()
    gg.toast("Turning OFF Maphack...")
    local list = gg.getListItems()
    if list and #list > 0 then
        for _, v in ipairs(list) do v.freeze = false; v.value = "98,784,247,822" end
        gg.setValues(list); gg.removeListItems(list)
    end
    for i = 1, 3 do
        gg.setRanges(gg.REGION_ANONYMOUS)
        gg.clearResults()
        gg.searchNumber("98,784,247,823", gg.TYPE_QWORD)
        local map_res = gg.getResults(99999)
        if map_res and #map_res > 0 then
            for _, v in ipairs(map_res) do v.value = "98,784,247,822"; v.freeze = false end
            gg.setValues(map_res)
        end
        gg.clearResults()
        gg.searchNumber("98,784,247,822;47,244,640,279;4,510,805,388,492,275,723:9", gg.TYPE_QWORD)
        if gg.getResultCount() > 0 then
            gg.refineNumber("98,784,247,822", gg.TYPE_QWORD)
            local extra_res = gg.getResults(99999)
            if extra_res and #extra_res > 0 then
                for _, v in ipairs(extra_res) do v.value = "98,784,247,822"; v.freeze = false end
                gg.setValues(extra_res)
            end
        end
        gg.clearResults(); gg.sleep(150)
    end
    save_status(maphack_file, false)
    gg.toast("MAPHACK SUCCESSFULLY OFF")
end

function Clear_Logs_Only()
    gg.toast("Clearing Logs...")
    local base_virtual = "/storage/emulated/0/Android/data/com.space.virtual/files/External/0/com.mobile.legends/"
    local cache_path = base_virtual .. "cache/"
    local files_path = base_virtual .. "files/"
    local space_logs = "/storage/emulated/0/Android/data/com.space.virtual/files/Log/"

    pcall(function()
        os.remove(space_logs .. "HiAdKitLog.log")
        os.remove(space_logs .. "HiAdSDKLog.log")
        os.remove(files_path .. "tombstone_00")
        os.remove(files_path .. "tombstone_01")
        os.remove(files_path .. "tombstone_02")
        os.remove(files_path .. "CountBattleCache")
        os.remove(files_path .. "CrashAsset")
        os.rename(cache_path .. "ML-HistoricalException", cache_path .. "ML-HistoricalException_bak")
        os.rename(cache_path .. "ML-Logcats", cache_path .. "ML-Logcats_bak")
        os.rename(cache_path .. "UnityShaderCache", cache_path .. "UnityShaderCache_bak")
        os.rename(cache_path .. "sdk", cache_path .. "sdk_bak")
        os.rename(files_path .. "dragon2017/BattleRecord", files_path .. "dragon2017/BattleRecord_bak")
        os.rename(files_path .. "ModeVersion", files_path .. "ModeVersion_bak")
        local login_data_path = files_path .. "dragon2017/login_data/"
        os.remove(login_data_path .. "login_auth_cache")
        os.remove(login_data_path .. "login_auth_md5")
        os.remove(login_data_path .. "check_upgrade_cache")
    end)
    
    gg.sleep(300)
    gg.toast("LOGS CLEARED SUCCESSFULLY")
end
function Memory_Bypass()
    gg.toast("Injecting Memory Bypass...")
    
    -- Hex Patching para sa libcsharp at liblogic
    local function PatchLib(lib, offset, hex)
        local ranges = gg.getRangesList(lib)
        if #ranges == 0 then return end
        local start = ranges[1].start
        local t = {}
        local i = 0
        for h in string.gmatch(hex, "%x+") do
            if #h == 2 then 
               table.insert(t, {address=start + offset + i, flags=4, value=h.."h"})
               i = i + 1
            end
        end
        gg.setValues(t)
    end

    pcall(function()
        PatchLib("libcsharp.so", 0x14742D4, "C0 03 5F D6")
        PatchLib("libcsharp.so", 0x14743CC, "C0 03 5F D6")
        PatchLib("libcsharp.so", 0x1474414, "C0 03 5F D6")
        PatchLib("liblogic.so", 0x556858, "C0 03 5F D6")
        PatchLib("liblogic.so", 0x556874, "C0 03 5F D6")
        PatchLib("liblogic.so", 0x590B00, "C0 03 5F D6")
        PatchLib("liblogic.so", 0x590B04, "C0 03 5F D6")
        PatchLib("liblogic.so", 0x590BCC, "C0 03 5F D6")
        PatchLib("liblogic.so", 0x590C40, "C0 03 5F D6")
    end)
    local stringsToPatch = {
        ":AReport_Reputation", 
        ":Report_Battle", 
        ":Cmd_MatchReport_PostMatch_CS", 
        ":Send_Battle_EndMiscDataReport_CS", 
        ":Cmd_AIAd_LogReport_CS", 
        ":OnReport"
    }

    pcall(function()
        gg.setRanges(gg.REGION_C_ALLOC | gg.REGION_C_DATA | gg.REGION_ANONYMOUS)
        gg.processResume()
        for _, str in ipairs(stringsToPatch) do
            gg.clearResults()
            gg.searchNumber(str, gg.TYPE_BYTE, false, gg.SIGN_EQUAL, 0, -1, 0)
            gg.getResults(99999, nil, nil, nil, nil, nil, nil, nil, nil)
            gg.editAll("0", gg.TYPE_BYTE)
        end
        gg.clearResults()
    end)
    
    gg.toast("MEMORY BYPASS INJECTED")
end
function MainMenu()
    gg.setVisible(false)
    
    local on_maphack = get_status(maphack_file)
    
    local menu_list = {
        "MEMORY BYPASS (ANTI BAN/REPORT)",
        "MAPHACK NO ICON",
        "CLEAR ALL LOGS",
        "CLOSE SCRIPT"
    }
    
    local initial_state = { false, on_maphack, false, false }
    
    local choice = gg.multiChoice(menu_list, initial_state, "🔰 𝐂𝐎𝐃𝐄𝐗 𝐌𝐋𝐁𝐁 𝐂𝐇𝐄𝐀𝐓𝐙 🔰\n\n📝 𝐕𝐞𝐫𝐬𝐢𝐨𝐧 : 𝟏.𝟑.𝟎\n👤 𝐎𝐰𝐧𝐞𝐫 : 𝐆𝐞𝐨𝐃𝐞𝐯𝐬𝟔𝟗")

    if choice == nil then 
        gg.setVisible(false) 
        return 
    end
    if choice[1] then Memory_Bypass() end
    
    if choice[2] and not on_maphack then 
        Apply_Maphack()
    elseif not choice[2] and on_maphack then 
        Off_Maphack_Only() 
    end
    
    if choice[3] then Clear_Logs_Only() end

    if choice[4] then
        gg.setVisible(false)
        os.exit(0)
    end
    
    gg.sleep(1000) 
    MainMenu()
end

while true do
    if gg.isVisible(true) then
        MainMenu()
    end
    gg.sleep(200) 
end
