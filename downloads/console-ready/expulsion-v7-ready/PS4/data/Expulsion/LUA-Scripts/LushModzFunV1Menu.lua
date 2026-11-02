-- Lush Modz Fun V1 | Expulsion PS4 GTA 1.57
-- Enable from Misc Options > LUA Scripts, then close Expulsion.
-- L1 + D-pad Down: open/close | X: select | Circle: back
-- Left/Right: adjust | Square: next theme | Triangle: next design
local a = assert(expulsion, 'Requires Expulsion with Fun UI API')
assert(a.rect and a.icon and a.fun, 'Update Expulsion PRX for Lush Modz Fun V1')
local visible, page, selected = true, 'home', 1
local theme, design, power = 1, 1, 35
local notice, noticeUntil = 'WELCOME TO YOUR PLAYGROUND', 0
local themes = {
 {'LUSH PURPLE', 188,121,255, 84,224,220},
 {'VICE SUNSET', 255,104,168, 255,195,91},
 {'ARCTIC', 96,211,255, 208,245,255},
 {'TOXIC', 156,248,71, 64,221,168},
 {'GOLD RUSH', 255,203,85, 255,242,188},
 {'CRIMSON', 255,83,106, 163,119,255}
}
local designs = {'ORBIT / FLOATING DOCK','PRISM / SPLIT PANEL','TERMINAL / COMPACT'}
local function say(s)
 notice, noticeUntil = s, a.time_ms()+2800
end
local function action(id)
 if a.fun(id,power) then say('DONE / '..notice)
 else say('UNAVAILABLE / enter driver seat, or leave vehicle for launch') end
end
local function item(label, description, icon, kind, value)
 return {label=label,desc=description,icon=icon or 0,kind=kind,value=value}
end
local pages={
 home={
  item('SELF PLAYGROUND','Launch, refresh and remix your character.',4,'page','self'),
  item('VEHICLE ARCADE','Hop, boost, repair and recolor your ride.',1,'page','vehicle'),
  item('WORLD MOOD','Set the scene with time and weather.',6,'page','world'),
  item('ANIMAL RIDES','Explore Los Santos with six animal mounts.',5,'page','animals'),
  item('DESIGN STUDIO','Six palettes. Three completely different frames.',2,'page','style'),
  item('HIDE MENU','L1 + D-pad Down brings the menu back.',0,'hide')
 },
 self={
  item('LAUNCH POWER','Adjust with Left / Right. Used by launches and boosts.',0,'power'),
  item('HUMAN SLINGSHOT','Launch straight up on foot. Watch your landing!',4,'fun',3),
  item('TURN AROUND','Instantly face the opposite direction.',0,'fun',4),
  item('HEALTH + ARMOUR','Restore maximum health and full armour.',4,'fun',0),
  item('FRESHEN UP','Remove blood and wetness.',2,'fun',1),
  item('SOAK CHARACTER','Apply a soaked appearance.',2,'fun',2),
  item('OUTFIT REMIX','Randomize compatible clothing components.',2,'fun',5)
 },
 vehicle={
  item('ARCADE POWER','Left / Right: set jump and boost strength.',0,'power'),
  item('VEHICLE HOP','Launch your current vehicle upward.',1,'fun',8),
  item('FORWARD BOOST','Accelerate in the direction your vehicle faces.',1,'fun',9),
  item('PAINT ROULETTE','Random primary and secondary GTA paint colors.',2,'fun',7),
  item('PIT STOP','Repair and clean your current vehicle.',1,'fun',6),
  item('RIGHT SIDE UP','Level your vehicle and place it on the ground.',1,'fun',10)
 },
 world={
  item('HIGH NOON','Set the local game clock to 12:00.',6,'fun',11),
  item('MIDNIGHT','Set the local game clock to 00:00.',6,'fun',12),
  item('GOLDEN HOUR','Set the local game clock to 19:00.',6,'fun',13),
  item('ENDLESS SUMMER','Choose extra sunny weather.',6,'fun',14),
  item('STORM CHASER','Choose thunderstorm weather.',6,'fun',15),
  item('SNOW DAY','Choose Christmas snow weather.',6,'fun',16)
 },
 animals={
  item('RIDE A DEER','Begin the existing Expulsion animal ride.',5,'mount','deer'),
  item('RIDE A COW','Begin the existing Expulsion animal ride.',5,'mount','cow'),
  item('RIDE A BOAR','Begin the existing Expulsion animal ride.',5,'mount','boar'),
  item('RIDE A PIG','Begin the existing Expulsion animal ride.',5,'mount','pig'),
  item('RIDE A HUSKY','Begin the existing Expulsion animal ride.',5,'mount','husky'),
  item('RIDE A MOUNTAIN LION','Begin the existing Expulsion animal ride.',5,'mount','mountain_lion'),
  item('DISMOUNT / REMOVE','Remove the animal owned by this script.',5,'dismount')
 },
 style={
  item('COLOR THEME','Left / Right or Square: change palette.',2,'theme'),
  item('MENU DESIGN','Left / Right or Triangle: change layout.',2,'design'),
  item('RESET LOOK','Restore Lush Purple and the Orbit layout.',0,'reset'),
  item('CONTROLS','L1 + Down opens. X selects. Circle returns.',0,'help')
 }
}
local titles={home='YOUR PLAYGROUND',self='SELF PLAYGROUND',vehicle='VEHICLE ARCADE',world='WORLD MOOD',animals='ANIMAL RIDES',style='DESIGN STUDIO'}
local function adjust(row,delta)
 if row.kind=='power' then power=math.max(0,math.min(100,power+delta*5))
 elseif row.kind=='theme' then theme=(theme-1+delta)%#themes+1
 elseif row.kind=='design' then design=(design-1+delta)%#designs+1 end
end
local function activate(row)
 if row.kind=='page' then page,selected=row.value,1
 elseif row.kind=='fun' then notice=row.label;action(row.value)
 elseif row.kind=='mount' then
  if a.mount_start(row.value) then visible=false;a.notify('Animal ride: left stick move, hold X run, Triangle dismount.')
  else say('ANOTHER RIDE IS ACTIVE / stop it first') end
 elseif row.kind=='dismount' then a.mount_stop();say('ANIMAL RIDE REMOVED')
 elseif row.kind=='hide' then visible=false
 elseif row.kind=='reset' then theme,design=1,1;say('DEFAULT LOOK RESTORED')
 elseif row.kind=='help' then say('CLOSE EXPULSION TO USE THIS MENU')
 else adjust(row,1) end
end
local function draw(now)
 local t=themes[theme];local r,g,b=t[2],t[3],t[4]
 local x=design==2 and .115 or .075
 local w=design==3 and .275 or .32
 local center=x+w/2
 local function rect(cx,cy,rw,rh,rr,gg,bb,aa) a.rect(cx,cy,rw,rh,rr,gg,bb,aa or 255) end
 local function text(s,tx,ty,scale,accent) a.text(s,tx,ty,scale,accent or false) end
 -- Layered shadow, perimeter, accent rail and a floating identity badge.
 rect(center+.007,.397,w+.018,.584,0,0,0,105)
 rect(center,.39,w+.004,.574,r,g,b,160)
 rect(center,.39,w,.57,12,15,24,245)
 rect(x+.002,.39,.004,.57,r,g,b)
 if design==2 then
  rect(x-.029,.39,.048,.574,21,25,38,250)
  for i=0,5 do a.icon(i,x-.029,.20+i*.067,.019,r,g,b) end
 end
 rect(center,.153,w,.096,23,26,42,255)
 if design==1 then
  for i=0,7 do rect(x+w-.012-i*.008,.137+i*.005,.004,.045,t[5],t[6],t[7],75+i*19) end
 elseif design==2 then rect(center,.108,w,.008,r,g,b)
 else rect(center,.199,w,.002,r,g,b) end
 text('LUSH MODZ',x+.018,.115,.43)
 text('FUN / V1.0',x+.019,.162,.25)
 a.icon(5,x+w-.035,.166,.025,r,g,b)
 text(titles[page],x+.016,.216,.28)
 text(string.format('%02d / %02d',selected,#pages[page]),x+w-.075,.219,.23)
 local rows=pages[page]
 local first=math.max(1,selected-5)
 for i=first,math.min(#rows,first+5) do
  local y=.275+(i-first)*.049
  local chosen=i==selected
  if chosen then
   rect(center,y+.012,w-.024,.044,r,g,b,35)
   rect(x+.013,y+.012,.003,.044,r,g,b)
   rect(x+w-.02,y+.012,.006,.006,t[5],t[6],t[7])
  elseif design~=3 then rect(center,y+.012,w-.024,.043,22,26,38,140) end
  a.icon(rows[i].icon,x+.035,y+.012,.019,chosen and r or 140,chosen and g or 151,chosen and b or 175)
  local label=rows[i].label
  if rows[i].kind=='power' then label=label..' <'..power..'>' end
  text(label,x+.055,y,.25,chosen)
 end
 -- Selected-option description is kept separate from the navigation rows.
 rect(center,.603,w-.024,.067,24,28,43,240)
 local desc=rows[selected].desc
 if rows[selected].kind=='theme' then desc=themes[theme][1]..' / '..desc end
 if rows[selected].kind=='design' then desc=designs[design] end
 local split=desc:sub(1,43):match('^.*() ')
 if #desc>43 then
  split=split or 43;text(desc:sub(1,split),x+.02,.577,.22)
  text(desc:sub(split+1),x+.02,.602,.22)
 else text(desc,x+.02,.59,.22) end
 local pulse=math.floor(150+80*math.sin(now/500))
 rect(x+.021,.66,.006,.009,r,g,b,pulse)
 text(themes[theme][1]..' / '..(design==1 and 'ORBIT' or design==2 and 'PRISM' or 'TERMINAL'),x+.032,.649,.22)
 text('X SELECT   O BACK   L/R ADJUST',x+.012,.695,.23)
 text('SQUARE THEME   TRIANGLE DESIGN',x+.012,.723,.22)
 if now<noticeUntil then
  rect(center,.79,w,.045,22,26,38,245)
  text(notice:sub(1,58),x+.012,.777,.21)
 end
end
return {
 init=function() a.notify('Lush Modz Fun V1 enabled. Close Expulsion. L1 + D-pad Down opens/closes.') end,
 tick=function()
  if a.menu_open() then return end
  local now=a.time_ms()
  if a.held('l1') and a.pressed('down') then
   a.disable('l1');a.disable('down');visible=not visible;return
  end
  if not visible then return end
  for _,button in ipairs({'up','down','left','right','cross','circle','square','triangle','l1'}) do a.disable(button) end
  if a.pressed('circle') then
   if page=='home' then visible=false else page,selected='home',1 end
   return
  end
  local rows=pages[page]
  if a.pressed('up') then selected=(selected-2)%#rows+1 end
  if a.pressed('down') then selected=selected%#rows+1 end
  if a.pressed('left') then adjust(rows[selected],-1) end
  if a.pressed('right') then adjust(rows[selected],1) end
  if a.pressed('square') then theme=theme%#themes+1 end
  if a.pressed('triangle') then design=design%#designs+1 end
  if a.pressed('cross') then activate(rows[selected]) end
  if visible then draw(now) end
 end,
 stop=function() a.mount_stop() end
}
