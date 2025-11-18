wrk.method = "POST"
wrk.headers["Content-Type"] = "application/json"

-- Optional Authorization: prefer tokens file, else single token from env, else none
local tokens_file = os.getenv("WRK_TOKENS_FILE")
local single_token = os.getenv("WRK_AUTH_TOKEN")
local tokens = {}

if tokens_file ~= nil and tokens_file ~= "" then
  for line in io.lines(tokens_file) do
    local t = (line or ""):gsub("\r", ""):gsub("\n", "")
    if #t > 0 then
      tokens[#tokens + 1] = t
    end
  end
end

function init(args)
  -- Choose a token once per thread; avoid doing auth per request
  if #tokens > 0 then
    math.randomseed(os.time() + tonumber(wrk.thread:index()))
    local idx = math.random(1, #tokens)
    wrk.headers["Authorization"] = "Bearer " .. tokens[idx]
  elseif single_token ~= nil and single_token ~= "" then
    wrk.headers["Authorization"] = "Bearer " .. single_token
  end
end

local query = os.getenv("QUERY") or "meeting"
local user_id = tonumber(os.getenv("USER_ID") or "1")
local limit = tonumber(os.getenv("LIMIT") or "20")
local skip = tonumber(os.getenv("SKIP") or "0")

wrk.body = string.format('{"query":"%s","user_id":%d,"limit":%d,"skip":%d}', query, user_id, limit, skip)