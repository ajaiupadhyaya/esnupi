/**
 * Film photography metadata — one entry per image file in ./images/
 *
 * `file` must match the filename exactly.
 * Fill in `title`, `location`, and `blurb`; leave them as "" until you’re ready —
 * empty / whitespace-only strings fall back to a prettified filename for title
 * and show blank for location and blurb (see library.ts).
 *
 * Order here is gallery order for listed files; any file not listed is appended
 * after, sorted by filename (see library.ts).
 */
export type PhotoManifestEntry = {
  file: string;
  title: string;
  location: string;
  blurb: string;
};

export const PHOTO_MANIFEST: PhotoManifestEntry[] = [
  {
    file: "america.jpg",
    title: "test",
    location: "lower manhattan",
    blurb: "shot on Ektar 400 35mm film",
  },
  {
    file: "babyshowercali.jpg",
    title: "mamma's baby shower",
    location: "socal",
    blurb: "shot on unlabled fuji film 35mm",
  },
  {
    file: "beach.jpg",
    title: "friends at the beach",
    location: "myrtle beach",
    blurb: "shot on kodak gold 35mm",
  },
  {
    file: "beach2.jpg",
    title: "friends at the beach pt.2",
    location: "myrtle beach",
    blurb: "shot on kodak gold 35mm",
  },
  {
    file: "beach3.jpg",
    title: "friends at the beach pt.3",
    location: "myrtle beach",
    blurb: "shot on kodak gold 35mm",
  },
  {
    file: "beach4.jpg",
    title: "alex on the beach",
    location: "myrtle beach",
    blurb: "shot on kodak gold 35mm",
  },
  {
    file: "beautiful.jpg",
    title: "port auth 2023",
    location: "lower manhattan",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "beltline.jpg",
    title: "soho beltline",
    location: "lower manhattan",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "brandermilltrail.jpg",
    title: "trail i run and walk on",
    location: "richmond",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "calicreek.jpg",
    title: "creek dd and I went on a hike in Socal",
    location: "socal",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "california2023.jpg",
    title: "socal neighborhood 2023",
    location: "socal",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "choochooo.jpg",
    title: "trains feeding into monihan",
    location: "lower manhattan",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "cold.jpg",
    title: "cold city street",
    location: "lower manhattan",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "columbus.jpg",
    title: "columbus circle",
    location: "lower manhattan",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "coolcorner.jpg",
    title: "corner bakery + bmw",
    location: "soho",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "cornernyc.jpg",
    title: "corner nyc",
    location: "lower manhattan",
    blurb: "shot on ektar 400 35mm film, beautiful contrast",
  },
  {
    file: "cornernyc2.jpg",
    title: "corner nyc 2",
    location: "lower manhattan",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "cute.jpg",
    title: "my two awesome sisters on a hike",
    location: "richmond",
    blurb: "shot on unlabeled fuji film 35mm, anya and dd",
  },
  {
    file: "dapark.jpg",
    title: "nyu craziness",
    location: "soho",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "dapark2.jpg",
    title: "more wash. park",
    location: "washington park",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "dd.jpg",
    title: "dd and Elvis the horse in some rural town 2023",
    location: "rural town",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "ddeating.jpg",
    title: "dd eating the best banana pudding in the world",
    location: "bleaker street",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "ddhorse.jpg",
    title: "dd and elvis again",
    location: "rural town",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "ddreading.jpg",
    title: "pandemic times",
    location: "richmond",
    blurb: "dd reading a book with lysol in the foreground",
  },
  {
    file: "dds.jpg",
    title: "anya and dd at amusement park",
    location: "richmond",
    blurb: "sisters in line for scary ride",
  },
  {
    file: "elvis.jpg",
    title: "horsey",
    location: "rural town",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "family.jpg",
    title: "mamma and animika momma babyshower",
    location: "socal",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "familyparty.jpg",
    title: "babyshower festivities",
    location: "socal",
    blurb: "shot on kodak gold 35mm",
  },
  {
    file: "fourthyearcollege.jpg",
    title: "josh, ryan, and Dev on 1718 back deck",
    location: "charlottesville",
    blurb: "accidental double exposure shot on lomochrome 110mm film",
  },
  {
    file: "kitchencooking.jpg",
    title: "the best three women bonding",
    location: "richmond",
    blurb: "shot on unlabeled kodak film 35mm",
  },
  {
    file: "love2.jpg",
    title: "night walk linc center",
    location: "upper west side / 55th street",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "lovethisplace.jpg",
    title: "linc center at night",
    location: "upper west side / 55th street",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "mallatnight.jpg",
    title: "fourth floor mall hell's kitchen",
    location: "hell's kitchen",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "maya.jpg",
    title: "maya holding tennis balls",
    location: "richmond",
    blurb: "shot on ektar 100(?) 35mm film",
  },
  {
    file: "maya3.jpg",
    title: "maya in front of her house day of juno",
    location: "richmond",
    blurb: "shot on ektar 100(?) 35mm film",
  },
  {
    file: "maya4.jpg",
    title: "maya and I in da car",
    location: "richmond",
    blurb: "shot on ektar 100(?) 35mm film",
  },
  {
    file: "mayahand.jpg",
    title: "maya hand holding beautiful tree",
    location: "richmond",
    blurb: "shot on ektar 100(?) 35mm film",
  },
  {
    file: "mecollege.jpg",
    title: "shot by owen, myself on 1718 back deck",
    location: "charlottesville",
    blurb: "day of UVA Florida St. football game fall fourth year",
  },
  {
    file: "meh.jpg",
    title: "bleaker strt bmw",
    location: "bleaker street",
    blurb: "more of the bmw and bakery",
  },
  {
    file: "meh2.jpg",
    title: "upper west side",
    location: "upper west side",
    blurb: "I sat on a hydrant pipe and ate my chicken over rice EXTRA white sauce",
  },
  {
    file: "meinlondon.JPG",
    title: "shot by anya, myself in london",
    location: "london",
    blurb: "anya took this of me when I went and visited her when she lived there",
  },
  {
    file: "mewithhorse.jpg",
    title: "me with horsey friend",
    location: "rural town",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "midtown.jpg",
    title: "Upper East Side",
    location: "upper east side",
    blurb: "in car going to guggenheim and B&H",
  },
  {
    file: "newjpmg.jpg",
    title: "New JP Morgan Building",
    location: "midtown east / park ave",
    blurb: "I am in love with this building, I will work at JPMG after masters",
  },
  {
    file: "nyc subway.jpg",
    title: "long exposure subway",
    location: "Canal Street",
    blurb: "after strolling thru canal street",
  },
  {
    file: "nyc2023.jpg",
    title: "driving into manhattan",
    location: "jersey",
    blurb: "driving into manhattan listening to soprano theme song",
  },
  {
    file: "nyc2026.jpg",
    title: "nyc street",
    location: "near 7th ave",
    blurb: "shot on lomochrome 110mm film",
  },
  {
    file: "nycskyline.jpg",
    title: "driving through nyc skyline",
    location: "jersey",
    blurb: "driving through nyc skyline listening to soprano theme song",
  },
  {
    file: "nyu.jpg",
    title: "nyu visit",
    location: "greenwich village",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "nyu2.jpg",
    title: "nyu visit 2",
    location: "greenwich village",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "oldhouse.jpg",
    title: "da old house",
    location: "richmond",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "oldroom.jpg",
    title: "old room",
    location: "richmond",
    blurb: "my old room, pandemic room, shot on unlabeled fuji film 35mm",
  },
  {
    file: "oldview.jpg",
    title: "old view",
    location: "richmond",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "pandemic.jpg",
    title: "pandemic",
    location: "richmond",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "partytime.jpg",
    title: "partytime",
    location: "california",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "poetic.jpg",
    title: "poetic",
    location: "Upper East",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "reading.jpg",
    title: "anya reading a book",
    location: "richmond",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "redwoods2023.jpg",
    title: "redwoods 2023",
    location: "california",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "redwoodscali.jpg",
    title: "redwoods 2023",
    location: "california",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "rents.jpg",
    title: "nyc rents",
    location: "nyc",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "richmondguy.jpg",
    title: "richmond guy",
    location: "richmond",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "roof.jpg",
    title: "roof",
    location: "richmond",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "schoooolbus.jpg",
    title: "school bus",
    location: "richmond",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "sisters.jpg",
    title: "my two awesome sisters richmond hike",
    location: "richmond",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "sisters2.jpg",
    title: "two sisters again",
    location: "richmond",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "skyline2.jpg",
    title: "skyline",
    location: "nyc",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "skyline3.jpg",
    title: "skyline 3",
    location: "nyc",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "sleepy.jpg",
    title: "she sleepy in da chair",
    location: "nyc",
    blurb: "shot on unlabeled fuji film 35mm",
  },
  {
    file: "tWbeM.jpeg",
    title: "friends in snow",
    location: "charlottesville",
    blurb: "first snow storm of senior year, josh and dev playing spike in da snow",
  },
  {
    file: "teH7m.jpeg",
    title: "good lads on 1718 back deck",
    location: "charlottesville",
    blurb: "friends playing games, eating food",
  },
  {
    file: "uhoh.jpg",
    title: "oh no",
    location: "lower west",
    blurb: "infamous....",
  },
  {
    file: "walkingaway.jpg",
    title: "walking away from da park",
    location: "lower manhattan",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "walkingtosoho.jpg",
    title: "Got lost but nice view",
    location: "nyc",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "wow.jpg",
    title: "port auth 2023",
    location: "lower manhattan",
    blurb: "shot on ektar 400 35mm film",
  },
  {
    file: "yellowcab.jpg",
    title: "yellow cab 2026",
    location: "nyc",
    blurb: "shot on ektar 400 35mm film",
  },
];
