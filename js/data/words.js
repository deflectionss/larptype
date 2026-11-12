(() => {
  const roblox = `obby robux noob tycoon simulator avatar spawn respawn checkpoint lobby server badge gamepass friend follow
party chat emote dance jump sprint lava killbrick platform stage tower parkour pet egg hatch trade rare legendary mythic
secret exclusive limited catalog marketplace premium group admin moderator ban kick report round queue map vote minigame
roleplay town city house car boat plane sword gear tool hat hair face shirt pants outfit accessory bundle leaderboard
coins gems cash rebirth prestige upgrade multiplier boost potion quest boss raid dungeon wave mob loot chest drop
inventory shop crate spin wheel reward daily streak event hunt update patch codes redeem giveaway glitch lag ping afk
private vip experience place game player guest classic bacon studs baseplate brick block part sparkle trail aura wings
crown speedrun skip win lose team survive zombie escape prison police hero villain ninja fighting combat combo skill
ability cooldown stamina health damage heal shield armor level rank tier season pass battle royale arena island world
portal teleport hub zone area unlock collect grind farm afk idle clicker tap rebirths capsule mutation merge craft
build sandbox survival horror mystery puzzle racing tag hide seek parkour obstacle spinner conveyor ladder truss bounce
launch pad jetpack glider rocket slingshot superball trowel paintball laser blaster tag freeze lobbyist creator fan
favorite like dislike visits playing online offline profile username display name bio status inbox notification
servers join leave rejoin reconnect kicked loading terrain sky night day weather storm snow rain sunset beach desert
forest jungle volcano castle tower dungeon temple ruins cave mine crystal gold silver bronze diamond emerald ruby`;

  const robloxDev = `studio workspace explorer properties toolbox output command script localscript modulescript server client
replicate remote remoteevent remotefunction bindable datastore session leaderstats humanoid character rig weld
constraint attachment hinge spring rope anchored cancollide cantouch transparency reflectance material neon smooth
plastic wood metal glass forcefield terrain lighting atmosphere skybox bloom blur sunrays tween easing lerp cframe vector
raycast region overlap collision physics network ownership streaming instance parent child descendant ancestor
attribute tag module require event signal connection disconnect heartbeat renderstepped stepped task defer delay wait
coroutine debounce pcall retry ratelimit exploit sanity validate screengui frame textlabel textbutton imagelabel
scrollingframe uicorner uistroke uigradient uipadding uilistlayout uigridlayout aspectratio anchorpoint zindex viewport
billboard surfacegui proximityprompt clickdetector sound animation animator keyframe mesh meshpart union negate decal
texture rigging blender import publish version rollback collaborate universe asset package plugin toolbar widget
devforum docs api engine luau typecheck strict analytics retention monetization payout sponsor thumbnail icon genre
discovery playtest beta launch hotfix bug crash memory leak profiler microprofiler framerate optimization culling
batching pooling spawner handler manager service controller framework signal promise janitor maid cleanup lifecycle
serialize deserialize encode decode json httpservice webhook badge gamepass product receipt purchase prompt sanity
throttle budget queue session lock migration backup schema default fallback config constants utils shared
replicatedstorage serverstorage serverscriptservice startergui starterplayer startercharacter backpack camera
collectionservice tweenservice runservice userinputservice contextaction gamepad keyboard mouse touch input binding
pathfinding waypoint navmesh agent npc dialog quest system inventory slot stack equip unequip hitbox raycasting
projectile velocity gravity friction density elasticity assembly mass center pivot origin offset rotation orientation`;

  const luau = `local function end if then else elseif for in do while repeat until return break continue nil true false
and or not self`;

  const vibe = `prompt vibe vibes agent agentic model tokens context window chat assistant autocomplete completion diff patch
commit push pull merge rebase branch deploy ship prod staging localhost terminal shell bash npm install build lint test
tests failing passing refactor rewrite debug stacktrace error undefined null crash fix hotfix revert rollback review
approve lgtm nit todo fixme hack workaround edge case bug feature mvp prototype demo launch waitlist landing page saas
startup founder pivot scale users metrics dashboard analytics api endpoint json schema database migration query index
cache latency async await promise callback closure recursion iterate loop array object string number boolean function
class module package dependency version semver release changelog readme docs issue ticket sprint standup backlog
roadmap spec mockup design component layout responsive dark mode theme animation smooth polish pixel perfect
hallucinate hallucination temperature embedding vector retrieval finetune inference benchmark eval regex yaml config
env secret auth login oauth session cookie cors webhook cron queue worker serverless edge container docker cloud gpu
compute rate limit quota overflow stack heap memory garbage collector oneshot vibecode vibecoding tool toolcall subagent
worktree plan accept reject retry regenerate undo redo context reasoning instructions system guardrails sandbox
permissions token budget streaming response request payload header status timeout websocket realtime frontend backend
fullstack framework library typescript javascript python rust golang react svelte vite tailwind postgres redis
supabase vercel netlify github gitignore monorepo workspace script cli flag argument output input pipeline ci
coverage snapshot mock fixture regression flaky green red shipping shipped iteration feedback loop prompting
copilot pair programming rubber duck focus flow state deep work late night coffee keyboard shortcut hotkey`;

  const ads = `ads advert advertise advertising sponsored sponsor sponsorship campaign campaigns budget bid bids bidding cpm
cpc ctr cpa cpi roas roi qptr ptr impressions impression clicks click conversion conversions funnel reach frequency
audience targeting retargeting creative creatives thumbnail thumbnails banner banners icon video trailer teaser
placement placements inventory playthrough plays visits engagement retention churn cohort ltv arpu arppu dau mau ccu
kpi kpis uplift lift variant analytics attribution organic paid promo promoted promotion marketing influencer
youtuber shorts viral trending recommended discovery homepage algorithm spend payout revenue rewarded portal immersive
billboard brand brands collab giveaway acquisition qualified sessions playtime search`;

  const common = `the be to of and a in that have it for not on with he as you do at this but his by from they we say her
she or an will my one all would there their what so up out if about who get which go me when make can like time no
just him know take people into year your good some could them see other than then now look only come its over think
also back after use two how our work first well way even new want any these give day most us big small old long short
fast slow hot cold red blue green black white light dark hand head eye face home house room door road car tree sun moon
star fire water air land sea city town world life love help play game fun run walk jump sit stand read write word line
page book story name friend family man child kid boy girl dog cat food eat drink sleep open close start stop turn move
push pull find keep hold show tell ask call try need feel seem leave put mean let begin end left right next last same
each every many much more less few both own sure true real best better great high low near far here where why yes ok
off down hard easy late soon yet still again never always often once team three four five six ten`;

  const short = `obby noob robux lag afk pet egg gem coin cash win lose map vote spawn boss loot drop shop trade rare epic quest
level rank skin hat emote dance chat party tower lava brick part build tool sword gear glitch ping badge stage round
lobby server avatar studs bacon guest vip codes event raid wave mob chest crate spin daily streak hatch merge craft
farm grind tycoon hub zone portal tag hide seek script local nil self tween lerp ray wait task signal remote client
module rig weld mesh decal sound frame gui camera input ship bug fix code test lint diff patch commit branch deploy
prompt vibe agent model token api json git npm bash debug prod repo cache async await loop array string const null
docs plan undo redo ads ctr cpm roas reach clicks views promo brand plays visits likes budget spend`;

  const split = s => [...new Set(s.split(/\s+/).filter(Boolean))];
  const words = [...new Set([roblox, robloxDev, luau, vibe, ads].flatMap(split))];
  const simple = [...new Set([common, short].flatMap(split))].filter(w => w.length <= 6);
  LT.PACKS = {
    roblox: { name: 'roblox', desc: 'roblox, studio, vibecoding and ad words', words },
    simple: { name: 'simple', desc: 'short everyday words mixed with short roblox and dev words', words: simple }
  };
  LT.PACK_ORDER = ['roblox', 'simple'];
})();
