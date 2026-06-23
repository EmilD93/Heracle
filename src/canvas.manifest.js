export const manifest = {
  screens: {
    scr_eii4p0: { name: "Discover Events", route: "/", state: {"activeTab":"dashboard","selectedEventId":null}, position: {"x":160,"y":220} },
    scr_0eq0vq: { name: "Event Details", route: "/", state: {"activeTab":"dashboard","selectedEventId":1}, position: {"x":1560,"y":220} },
    scr_gblc30: { name: "Organizer Dashboard", route: "/", state: {"activeTab":"organizer","selectedEventId":null}, position: {"x":160,"y":2200} },
  },
  sections: {
    sec_05ghxd: { name: "Browse & Details", x: 0, y: 0, width: 2920, height: 1180 },
    sec_anc614: { name: "Organizer Dashboard", x: 0, y: 1980, width: 1520, height: 1180 },
  },
  layers: [
    { kind: "section", id: "sec_05ghxd", children: [
      { kind: "screen", id: "scr_eii4p0" },
      { kind: "screen", id: "scr_0eq0vq" },
    ] },
    { kind: "section", id: "sec_anc614", children: [
      { kind: "screen", id: "scr_gblc30" },
    ] },
  ],
}
