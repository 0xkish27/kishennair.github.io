/* the four journeys. Each has stops, and each stop has tasks */
export const J = {
  lantern: {
    name:'The Lantern Path', tag:'Old KL after dark', em:'flame', ticket:49, diff:3, hc:'#FFB65C', bf:'sepia(.75) saturate(2.6) brightness(2) contrast(1.15)',
    g:'radial-gradient(55% 42% at 50% 40%,#e3a052,#6e2f14 48%,#140804 88%)', glow:'rgba(240,170,90,.5)', accent:'rgba(240,160,80,.22)',
    blurb:'Follow a lamplighter\'s lost light through the oldest streets in the city, from the river where KL began to a lane of painted ghosts.',
    walk:'2.2 km', time:'2 hrs', spend:'RM 0 to 10', best:'From 7:30 pm, when the river mist glows blue',
    start:'Masjid Jamek LRT', end:'Pasar Seni LRT or MRT',
    prologue:['A lamplighter once walked these streets with a lantern that could see what the city hides.','Tonight his lantern has chosen the two of you. Five places still hold a spark of its light.','Find them before the last lamp goes out.'],
    ending:'The last lamp catches. Every street you walked tonight glows a little brighter for it, and only the two of you know why. The lamplighter\'s light is yours now. Keep it lit.',
    word:'LUMEN', wordRiddle:'A unit of light. Arrange your five letters to speak it.',
    stops:[
      {name:'The Meeting of Waters', place:'River of Life, Masjid Jamek', q:'River of Life Masjid Jamek Kuala Lumpur', x:.56,y:.34, em:'mist', letter:'L', card:'The Mist Keeper', frag:'Where two become one, the light first remembered.',
       find:'Two waters meet and never fight. After dark they glow a ghostly blue. Stand where the city was born.',
       tasks:[
        {type:'riddle', prompt:'The city\'s name, in plain words, means "muddy ___". What is the missing word?', answers:['confluence','estuary','rivermouth','meetingofrivers','junction'], hint:'It\'s the word for the place where two rivers join.'},
        {type:'photo', prompt:'Stand at the railing with the blue mist behind you. One photo, both faces, nobody blinking.'}
       ]},
      {name:'The Clock Keeper', place:'Sultan Abdul Samad Building', q:'Sultan Abdul Samad Building Kuala Lumpur', x:.42,y:.27, em:'clock', letter:'U', card:'The Clock Keeper', frag:'He keeps every hour except the one you share.',
       find:'Copper domes and a tower that keeps the hour, standing guard over a great green field.',
       tasks:[
        {type:'split', a:'The tower was finished three years before', b:'the century turned. Enter the year.', code:'1897', hint:'The century turned in 1900.'},
        {type:'dare', dares:['Slow dance for ten seconds under the clock tower. No music allowed.','Whisper one thing you noticed about your person today. Out loud is too easy.','Stand back to back and each describe the tower without looking at it.']}
       ]},
      {name:'The Wide Field', place:'Dataran Merdeka', q:'Dataran Merdeka Kuala Lumpur', x:.3,y:.18, em:'star', letter:'M', card:'The Wide Field', frag:'A field remembers every promise made on it.',
       find:'A field so wide the sky feels closer, with a flagpole so tall you have to lean back to see the top.',
       tasks:[
        {type:'code', prompt:'On this field a flag first rose at midnight, on the 31st of August. Enter the year.', code:'1957', hint:'Late 1950s.'},
        {type:'tilt', layout:'field', prompt:'The last ember of the lamplighter\'s lantern is loose on the field. Carry it across the lawn to the flagpole without letting it touch the hedges.'},
        {type:'knowme', who:'b', key:'firstDate', prompt:'The lock only opens for someone who was paying attention. Where was your first date? Type what your person answered.'}
       ]},
      {name:'The Keeper of Markets', place:'Central Market (Pasar Seni)', q:'Central Market Kuala Lumpur', x:.5,y:.6, em:'scales', letter:'E', card:'The Market Keeper', frag:'Everything here has a price, except what you came with.',
       find:'Pale blue and white, built for trading, its doors first opened in the century before last.',
       tasks:[
        {type:'lightsout', prompt:'The market\'s lanterns have gone dark. Tapping one flips it and its neighbours. Light all nine.'},
        {type:'code', prompt:'This market first opened its doors in 18__. Enter the full year.', code:'1888', hint:'The last three digits are the same.'},
        {type:'photo', prompt:'Find the most beautiful thing for sale under RM 5 and take a photo of it. Do not buy it. Just admire it together.'}
       ]},
      {name:'The Little Ghost', place:'Kwai Chai Hong', q:'Kwai Chai Hong Kuala Lumpur', x:.66,y:.72, em:'ghost', letter:'N', card:'The Little Ghost', frag:'Small spirits guard the lanes nobody looks down.',
       find:'A narrow back lane of painted walls, where lanterns hang low and the name itself is a little spooky.',
       tasks:[
        {type:'beam', prompt:'The little ghost hid the light. Turn the tiles to carry the beam from the lamp to the lantern.'},
        {type:'spend', prompt:'Share one drink between you from any stall nearby. The lantern allows RM 10.', cap:10},
        {type:'photo', prompt:'Pick a mural and become part of it. Copy the pose of someone painted on the wall.'}
       ]}
    ]
  },
  starfall: {
    name:'The Starfall Garden', tag:'Romance under the towers', em:'moon', ticket:39, diff:2, hc:'#8FA2FF', bf:'saturate(1.7) brightness(2.2) contrast(1.15)',
    g:'radial-gradient(55% 42% at 50% 40%,#9aa8dc,#262c62 48%,#07081a 88%)', glow:'rgba(140,150,255,.55)', accent:'rgba(130,140,255,.25)',
    blurb:'Five fallen stars are hiding in the garden below the twin towers. Catch them all and you may make one wish on a bridge of light.',
    walk:'1.8 km', time:'1.5 to 2 hrs', spend:'RM 0', best:'Arrive by 7:45 pm to catch a free fountain show at 8, 9 or 10 pm',
    start:'KLCC LRT', end:'Saloma Link, near Kampung Baru LRT',
    prologue:['Every night a few stars slip out of the sky and hide where couples walk.','Five of them fell into the garden beneath the towers tonight.','Find them, and the last one will grant the two of you a wish.'],
    ending:'Five stars, caught and kept. On the bridge of light you made your wish. We sealed your letters and will send them back to you in a year, so the wish can tell you whether it came true.',
    word:'STARS', wordRiddle:'What fell from the sky tonight? Arrange your letters to name them.',
    stops:[
      {name:'The Silver Spires', place:'KLCC Esplanade', q:'Suria KLCC Esplanade', x:.5,y:.2, em:'towers', letter:'S', card:'The Silver Spires', frag:'Two towers that only touch once, high up, like hands.',
       find:'Two silver giants stand side by side, joined only by one bridge in the sky. Stand where they reflect in the water.',
       tasks:[
        {type:'code', prompt:'Each tower has the same number of floors. Two lucky numbers side by side. Enter it.', code:'88', hint:'The luckiest number in Chinese tradition, twice.'},
        {type:'photo', prompt:'Line yourselves up so the tops of both towers sit exactly on your heads. It takes a few tries.'}
       ]},
      {name:'The Dancing Water', place:'Lake Symphony, KLCC Park', q:'Lake Symphony KLCC Park', x:.56,y:.38, em:'fountain', letter:'T', card:'The Dancing Water', frag:'It dances only when someone is watching.',
       find:'Look for a lake that performs at the top of the hour. Sit on the edge and wait for it.',
       tasks:[
        {type:'riddle', prompt:'I dance without feet and sing without a voice. Every night I perform, and the show costs nothing. What am I?', answers:['fountain','fountains','lakesymphony','water','waterfountain'], hint:'You are sitting right in front of it.'},
        {type:'dare', dares:['While you wait for the show: two truths and a wish. Your person guesses which one is the wish.','Name three things you would put in a time capsule about this year. Go.','Teach your person a dance move. They must perform it when the water starts.']}
       ]},
      {name:'The Quiet Path', place:'KLCC Park walking trail', q:'KLCC Park jogging track', x:.34,y:.52, em:'path', letter:'A', card:'The Quiet Path', frag:'Some stars only fall where nobody is talking.',
       find:'Follow the soft rubber trail that loops through the trees. The star is hiding where the path bends near the water.',
       tasks:[
        {type:'dare', dares:['Walk 100 steps holding hands without saying a word. Whoever speaks first buys the next drink.']},
        {type:'catchstars', need:12, secs:25, prompt:'Stars are falling through the trees. Catch twelve before they reach the ground. Take turns with the phone.'},
        {type:'knowme', who:'a', key:'dreamTrip', prompt:'The star asks one question. Where in the world would your person most like to travel? Type what they answered.'}
       ]},
      {name:'The Star Gate', place:'KLCC Park, Jalan Kia Peng side', q:'KLCC Park', x:.62,y:.66, em:'keyhole', letter:'R', card:'The Star Gate', frag:'Every gate has a shape. Remember it and it opens.',
       find:'Leave the trees the way the joggers go. The gate is wherever the city noise comes back.',
       tasks:[
        {type:'constellation', prompt:'The gate is drawn in stars. Watch the shape, then trace it from memory, starting at the glowing star.'}
       ]},
      {name:'The Bridge of Light', place:'Saloma Link', q:'Saloma Link Kuala Lumpur', x:.22,y:.84, em:'bridge', letter:'S', card:'The Bridge of Light', frag:'A bridge that changes colour every time you look back.',
       find:'A curved bridge of light, 69 metres long, glowing over the highway between old and new.',
       tasks:[
        {type:'capsule', prompt:'Halfway across, each of you writes one sentence to your person. We seal it and send it back in a year.'},
        {type:'photo', prompt:'The colour-changing selfie. One photo, both of you, any colour you like.'}
       ]}
    ]
  },
  feast: {
    name:'The Feast of Riddles', tag:'A food quest on a budget', em:'bowl', ticket:49, diff:3, hc:'#FF7A86', bf:'hue-rotate(115deg) saturate(2.4) brightness(1.9) contrast(1.15)',
    g:'radial-gradient(55% 42% at 50% 40%,#df8a5a,#621b17 48%,#140505 88%)', glow:'rgba(240,110,90,.5)', accent:'rgba(230,100,80,.22)',
    blurb:'A hungry spirit lives between the stalls and trades secrets for flavours. Feed it five tastes with a purse of RM 40 and it will tell you its name.',
    walk:'1.2 km', time:'2 hrs', spend:'Capped at RM 40', best:'From 7 pm, when Jalan Alor fills up',
    start:'Bukit Bintang MRT or Monorail', end:'Bukit Bintang MRT',
    prologue:['A hungry spirit lives between the food stalls. Nobody has ever seen it, but everybody has fed it.','It trades secrets for flavours. Your purse holds RM 40.','Feed it well, spend it wisely, and at the end it will tell you its name.'],
    ending:'The spirit sighs, very full. It tells you its name and asks you to keep it secret. You ate like kings, and the purse barely noticed.',
    word:'FEAST', wordRiddle:'The spirit\'s name is what you just had. Arrange the letters.',
    purse:40,
    stops:[
      {name:'The Crossroads of Light', place:'Bukit Bintang junction', q:'Bukit Bintang junction Kuala Lumpur', x:.4,y:.66, em:'compass', letter:'F', card:'The Crossroads', frag:'Every feast begins with deciding where to start.',
       find:'Where the screens are brightest and four roads meet, under the train that glides overhead.',
       tasks:[
        {type:'riddle', prompt:'Before the spirit eats, it tests you. What has to be broken before you can use it?', answers:['egg','anegg','eggs'], hint:'You might find one on a plate of fried rice.'},
        {type:'dare', dares:['Decide who holds the purse tonight. Rock, paper, scissors, best of three.']}
       ]},
      {name:'The Street of Smoke', place:'Jalan Alor', q:'Jalan Alor Kuala Lumpur', x:.56,y:.42, em:'skewer', letter:'E', card:'The Street of Smoke', frag:'Smoke is just a recipe telling you where it is.',
       find:'One street over, follow the smoke and the plastic stools. The spirit is hungriest here.',
       tasks:[
        {type:'spend', prompt:'Find something on a stick. Under RM 10. Take the first bite at the same time.', cap:10},
        {type:'photo', prompt:'The first-bite photo. Both of you, mid-bite, no posing.'},
        {type:'riddle', prompt:'What gets wetter the more it dries?', answers:['towel','atowel','towels','napkin','tissue'], hint:'You will want one after those skewers.'}
       ]},
      {name:'The Blind Order', place:'Any stall on Jalan Alor', q:'Jalan Alor Kuala Lumpur', x:.62,y:.3, em:'eye', letter:'A', card:'The Blind Order', frag:'Trust tastes better when you did not choose it.',
       find:'Pick any stall you have never eaten at. The stranger the better.',
       tasks:[
        {type:'blind', who:'b', key:'lateFood', prompt:'One of you orders for the other without asking anything. Budget RM 12. Use what you know about their taste.', cap:12},
        {type:'rate', prompt:'The eater rates the order. Be honest. The spirit can tell.'}
       ]},
      {name:'The Cold Charm', place:'Any dessert stall nearby', q:'Jalan Alor dessert', x:.5,y:.2, em:'snow', letter:'S', card:'The Cold Charm', frag:'Something cold, shared slowly, cools any argument.',
       find:'The spirit wants something cold. Look for ice, fruit or anything that melts.',
       tasks:[
        {type:'spend', prompt:'One cold dessert to share. Under RM 8. One spoon only.', cap:8},
        {type:'memory', prompt:'The spirit hid its cold charms under twelve plates. Find all six pairs in as few turns as you can.'}
       ]},
      {name:'The Spirit\'s Table', place:'Changkat Bukit Bintang', q:'Changkat Bukit Bintang', x:.28,y:.32, em:'bowl', letter:'T', card:'The Feast Spirit', frag:'A full purse is nice. A full heart is the point.',
       find:'Walk up the little hill where the music spills out of the shophouses. The spirit is waiting on the steps.',
       tasks:[
        {type:'scale', target:20, prompt:'The spirit will only say its name for exactly RM 20 of food. Choose three dishes from its menu that add up to exactly RM 20.', items:[['Grilled skewers',6],['Fried noodles',9],['Mango sticky rice',8],['Iced lemon tea',3],['Chicken wings',7],['Fresh coconut',5]]},
        {type:'purse'},
        {type:'dare', dares:['Each name the best thing you ate tonight. If you pick the same one, you both win.']}
       ]}
    ]
  },
  echo: {
    name:'The Echo Trail', tag:'A night of sound and song', em:'note', ticket:49, diff:4, hc:'#7FD6C8', bf:'hue-rotate(-80deg) saturate(1.9) brightness(2) contrast(1.15)',
    g:'radial-gradient(55% 42% at 50% 40%,#7ccfbf,#18504c 48%,#04110f 88%)', glow:'rgba(110,230,210,.5)', accent:'rgba(100,220,200,.2)',
    blurb:'The city keeps an echo of every song ever sung in it, and tonight the echoes are loose. Catch four of them and the city plays one just for you.',
    walk:'1.5 km', time:'1.5 hrs', spend:'RM 0 to 5', best:'From 8 pm, when the buskers come out',
    start:'Bukit Bintang MRT or Monorail', end:'Bukit Bintang MRT',
    prologue:['Every song ever sung in this city left an echo behind.','Most nights they sleep. Tonight four of them are loose on the streets of Bukit Bintang.','Catch them, and the city will play one song just for the two of you.'],
    ending:'Four echoes caught. As you turn to leave, someone somewhere starts playing a song you both know. Coincidence, probably. Probably.',
    word:'ECHO', wordRiddle:'What is a sound that comes back to you? Arrange your letters.',
    stops:[
      {name:'The Noisy Crossing', place:'Bukit Bintang junction', q:'Bukit Bintang junction Kuala Lumpur', x:.44,y:.66, em:'rings', letter:'E', card:'The Loud Crossing', frag:'The loudest corner hides the softest echo.',
       find:'Stand where four roads meet and a train glides overhead. Close your eyes for ten seconds and just listen.',
       tasks:[
        {type:'tilt', layout:'lanes', prompt:'An echo is lost between the traffic lanes. Roll it through the gaps to the quiet corner where it can be heard.'},
        {type:'checklist', prompt:'Sound hunt. Tick each one when you both hear it. You need four of five.', items:['A train passing overhead','A street performer','Someone laughing','A car horn','Music from a shop'], need:4}
       ]},
      {name:'The Wandering Song', place:'Bukit Bintang walkway', q:'Bukit Bintang walk Kuala Lumpur', x:.6,y:.48, em:'note', letter:'C', card:'The Wandering Song', frag:'A song sung for strangers is still a gift.',
       find:'Follow the music along the walkway. The echo is hiding inside a busker\'s song.',
       tasks:[
        {type:'rhythm', need:6, prompt:'Rings fall toward the centre on the busker\'s beat. Tap the moment each ring touches the circle. Catch six of ten.'},
        {type:'spend', prompt:'Listen to one full song together. Optional: tip the busker. The echo allows RM 5.', cap:5},
        {type:'photo', prompt:'A photo of the two of you with the busker in the background. Ask first.'}
       ]},
      {name:'The Hum Duel', place:'Any bench on the walkway', q:'Bukit Bintang walk Kuala Lumpur', x:.38,y:.36, em:'waves', letter:'H', card:'The Hum', frag:'Everyone knows the tune. Nobody knows the words.',
       find:'Find a bench. The third echo only appears when someone hums.',
       tasks:[ {type:'hum'} ]},
      {name:'The Last Echo', place:'Changkat Bukit Bintang', q:'Changkat Bukit Bintang', x:.24,y:.26, em:'flame', letter:'O', card:'The Last Echo', frag:'The last note always lingers longest.',
       find:'Up the little hill where live music spills out of the old shophouses.',
       tasks:[ {type:'simon', len:5} ]}
    ]
  }
};
