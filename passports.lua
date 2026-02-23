-- passports.lua
wrk.method = "POST"
wrk.body   = '{"templateId":"f5b6bb13-f563-4e21-bfa2-18718a33b2f4"}'

wrk.headers["Accept"] = "application/json, text/plain, */*"
wrk.headers["Content-Type"] = "application/json"
wrk.headers["Origin"] = "http://localhost:3000"
wrk.headers["Referer"] = "http://localhost:3000/organizations/6964ea16591b8167e420f935/passports"
wrk.headers["Cache-Control"] = "no-cache"
wrk.headers["Pragma"] = "no-cache"

-- If your API needs cookies for auth, keep this. Otherwise remove it.
wrk.headers["Cookie"] = "i18n_redirected=en; better-auth.session_token=0aUrTGn8kO0nKRSIvT8bY7m3VenfeTuX.1OVh0JQ%2FHX2HF1gTgjDpjxR%2FPTTcTGkUo0iglgIQx2Q%3D; better-auth.dont_remember=true.voc6BgvAktkao%2B8PLIRhdbaIDfv0l2t%2F%2FmQsg5fvPIM%3D"

-- Your curl shows these two headers exist but have EMPTY values:
--   -H 'Authorization;'
--   -H 'service_token;'
-- wrk cannot send "header-without-colon"; and empty auth headers are useless anyway.
-- If you *do* need them, set real values like:
-- wrk.headers["Authorization"] = "Bearer <token>"
-- wrk.headers["service_token"] = "<token>"
