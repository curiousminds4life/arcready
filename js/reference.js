(function(){
  'use strict';
  var ArcReady = window.ArcReady = window.ArcReady || {};

  var symbols = [
    // ── POWER SOURCES ──────────────────────────────────────────
    {name:'AC Voltage Source', category:'Power Sources', description:'Provides alternating current to a circuit.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="25" r="18" fill="#fff" stroke="#1A1A1A" stroke-width="2"/><path d="M32,25 Q36,15 40,25 Q44,15 48,25" fill="none" stroke="#1A1A1A" stroke-width="2"/><line x1="0" y1="25" x2="22" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="58" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'DC Voltage Source', category:'Power Sources', description:'Provides direct current to a circuit.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="28" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="28" y1="12" x2="28" y2="38" stroke="#1A1A1A" stroke-width="3"/><line x1="38" y1="18" x2="38" y2="32" stroke="#1A1A1A" stroke-width="1.5"/><line x1="38" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/><text x="22" y="10" font-size="9" font-weight="bold" fill="#CC0000">+</text><text x="42" y="10" font-size="9" fill="#333">\u2212</text></svg>'},
    {name:'Battery (Single Cell)', category:'Power Sources', description:'Single electrochemical cell. Long line = positive terminal.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="28" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="28" y1="10" x2="28" y2="40" stroke="#1A1A1A" stroke-width="3"/><line x1="38" y1="17" x2="38" y2="33" stroke="#1A1A1A" stroke-width="1.5"/><line x1="38" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'Battery (Multi-Cell)', category:'Power Sources', description:'Multiple cells in series for higher voltage.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="14" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="14" y1="10" x2="14" y2="40" stroke="#1A1A1A" stroke-width="3"/><line x1="22" y1="17" x2="22" y2="33" stroke="#1A1A1A" stroke-width="1.5"/><line x1="22" y1="25" x2="34" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="34" y1="10" x2="34" y2="40" stroke="#1A1A1A" stroke-width="3"/><line x1="42" y1="17" x2="42" y2="33" stroke="#1A1A1A" stroke-width="1.5"/><line x1="42" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    // ── PASSIVE ────────────────────────────────────────────────
    {name:'Resistor (NEMA)', category:'Passive', description:'Limits current flow. North American zigzag symbol.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="12" y2="25" stroke="#1A1A1A" stroke-width="2"/><polyline points="12,25 16,13 24,37 32,13 40,37 48,13 56,37 60,25 68,25 80,25" fill="none" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'Resistor (IEC)', category:'Passive', description:'Limits current flow. International rectangle symbol.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="16" y2="25" stroke="#1A1A1A" stroke-width="2"/><rect x="16" y="14" width="48" height="22" fill="#fff" stroke="#1A1A1A" stroke-width="2"/><line x1="64" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'Capacitor (Fixed)', category:'Passive', description:'Stores electrical energy in an electric field.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="32" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="32" y1="10" x2="32" y2="40" stroke="#1A1A1A" stroke-width="3"/><line x1="42" y1="10" x2="42" y2="40" stroke="#1A1A1A" stroke-width="3"/><line x1="42" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'Capacitor (Polarized)', category:'Passive', description:'Electrolytic capacitor with polarity. Curved plate = negative.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="32" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="32" y1="10" x2="32" y2="40" stroke="#1A1A1A" stroke-width="3"/><path d="M42,10 Q50,25 42,40" fill="none" stroke="#1A1A1A" stroke-width="3"/><line x1="46" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/><text x="20" y="10" font-size="9" font-weight="bold" fill="#CC0000">+</text></svg>'},
    {name:'Inductor / Coil', category:'Passive', description:'Stores energy in a magnetic field. Opposes current changes.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="10" y2="25" stroke="#1A1A1A" stroke-width="2"/><path d="M10,25 Q16,10 22,25 Q28,10 34,25 Q40,10 46,25 Q52,10 58,25 Q64,10 70,25" fill="none" stroke="#1A1A1A" stroke-width="2"/><line x1="70" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    // ── SWITCHES ───────────────────────────────────────────────
    {name:'SPST Switch (Open)', category:'Switches', description:'Single-pole single-throw. Opens/closes one circuit path.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="22" y2="25" stroke="#1A1A1A" stroke-width="2"/><circle cx="22" cy="25" r="3" fill="#1A1A1A"/><circle cx="58" cy="25" r="3" fill="#1A1A1A"/><line x1="22" y1="25" x2="52" y2="10" stroke="#1A1A1A" stroke-width="2"/><line x1="58" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'SPST Switch (Closed)', category:'Switches', description:'Single-pole single-throw in closed (ON) state.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="22" y2="25" stroke="#1A1A1A" stroke-width="2"/><circle cx="22" cy="25" r="3" fill="#1A1A1A"/><circle cx="58" cy="25" r="3" fill="#1A1A1A"/><line x1="22" y1="25" x2="58" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="58" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'SPDT Switch', category:'Switches', description:'Single-pole double-throw. Selects between two circuit paths.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="22" y2="25" stroke="#1A1A1A" stroke-width="2"/><circle cx="22" cy="25" r="3" fill="#1A1A1A"/><circle cx="58" cy="15" r="3" fill="#1A1A1A"/><circle cx="58" cy="35" r="3" fill="#1A1A1A"/><line x1="22" y1="25" x2="52" y2="12" stroke="#1A1A1A" stroke-width="2"/><line x1="58" y1="15" x2="80" y2="10" stroke="#1A1A1A" stroke-width="2"/><line x1="58" y1="35" x2="80" y2="38" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'NO Pushbutton', category:'Switches', description:'Normally Open pushbutton. Closes circuit when pressed.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="32" x2="26" y2="32" stroke="#1A1A1A" stroke-width="2"/><line x1="26" y1="20" x2="54" y2="20" stroke="#1A1A1A" stroke-width="2"/><line x1="40" y1="20" x2="40" y2="10" stroke="#1A1A1A" stroke-width="1.5"/><rect x="30" y="6" width="20" height="7" fill="#fff" stroke="#1A1A1A" stroke-width="1.5" rx="2"/><line x1="26" y1="32" x2="26" y2="20" stroke="none"/><circle cx="26" cy="32" r="3" fill="#1A1A1A"/><circle cx="54" cy="32" r="3" fill="#1A1A1A"/><line x1="54" y1="20" x2="54" y2="32" stroke="none"/><line x1="54" y1="32" x2="80" y2="32" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'NC Pushbutton', category:'Switches', description:'Normally Closed pushbutton. Opens circuit when pressed.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="32" x2="26" y2="32" stroke="#1A1A1A" stroke-width="2"/><circle cx="26" cy="32" r="3" fill="#1A1A1A"/><circle cx="54" cy="32" r="3" fill="#1A1A1A"/><line x1="26" y1="32" x2="54" y2="32" stroke="#1A1A1A" stroke-width="2"/><line x1="40" y1="32" x2="40" y2="10" stroke="#1A1A1A" stroke-width="1.5"/><rect x="30" y="6" width="20" height="7" fill="#fff" stroke="#1A1A1A" stroke-width="1.5" rx="2"/><line x1="54" y1="32" x2="80" y2="32" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'Selector Switch', category:'Switches', description:'Multi-position rotary switch for mode selection.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="25" r="14" fill="#fff" stroke="#1A1A1A" stroke-width="2"/><line x1="0" y1="25" x2="26" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="54" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="40" y1="25" x2="50" y2="15" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    // ── CONTACTS ───────────────────────────────────────────────
    {name:'NO Contact', category:'Contacts', description:'Normally Open contact. Used in relay/contactor ladder logic.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="28" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="28" y1="14" x2="28" y2="36" stroke="#1A1A1A" stroke-width="2.5"/><line x1="52" y1="14" x2="52" y2="36" stroke="#1A1A1A" stroke-width="2.5"/><line x1="52" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'NC Contact', category:'Contacts', description:'Normally Closed contact. Opens when coil energized.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="28" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="28" y1="14" x2="28" y2="36" stroke="#1A1A1A" stroke-width="2.5"/><line x1="52" y1="14" x2="52" y2="36" stroke="#1A1A1A" stroke-width="2.5"/><line x1="28" y1="25" x2="52" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="52" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'Time-Delay NO', category:'Contacts', description:'Timed normally open contact. Closes after time delay.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="28" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="28" y1="14" x2="28" y2="36" stroke="#1A1A1A" stroke-width="2.5"/><line x1="52" y1="14" x2="52" y2="36" stroke="#1A1A1A" stroke-width="2.5"/><line x1="52" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/><path d="M34,10 Q40,4 46,10" fill="none" stroke="#1A1A1A" stroke-width="1.5"/></svg>'},
    {name:'Time-Delay NC', category:'Contacts', description:'Timed normally closed contact. Opens after time delay.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="28" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="28" y1="14" x2="28" y2="36" stroke="#1A1A1A" stroke-width="2.5"/><line x1="52" y1="14" x2="52" y2="36" stroke="#1A1A1A" stroke-width="2.5"/><line x1="28" y1="25" x2="52" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="52" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/><path d="M34,38 Q40,44 46,38" fill="none" stroke="#1A1A1A" stroke-width="1.5"/></svg>'},
    // ── PROTECTION ─────────────────────────────────────────────
    {name:'Fuse (Cartridge)', category:'Protection', description:'One-time overcurrent protection — melts to permanently open circuit on fault. Must be replaced after operation.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="16" y2="25" stroke="#1A1A1A" stroke-width="2"/><rect x="16" y="14" width="48" height="22" fill="#fff" stroke="#1A1A1A" stroke-width="2" rx="3"/><line x1="40" y1="14" x2="40" y2="36" stroke="#1A1A1A" stroke-width="1.5"/><line x1="64" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'Thermal Overload', category:'Protection', description:'Trips on sustained overcurrent to protect motors. Automatically resets after cooling. Heater element responds to heat from excess current.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="14" y2="25" stroke="#1A1A1A" stroke-width="2"/><path d="M14,25 Q20,15 26,25 Q32,15 38,25 Q44,15 50,25 Q56,15 62,25" fill="none" stroke="#1A1A1A" stroke-width="2"/><line x1="62" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'Circuit Breaker', category:'Protection', description:'Resettable overcurrent protection device.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="22" y2="25" stroke="#1A1A1A" stroke-width="2"/><circle cx="22" cy="25" r="3" fill="#1A1A1A"/><circle cx="58" cy="25" r="3" fill="#1A1A1A"/><line x1="22" y1="25" x2="52" y2="10" stroke="#1A1A1A" stroke-width="2"/><line x1="38" y1="19" x2="44" y2="10" stroke="#1A1A1A" stroke-width="1.5"/><line x1="58" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'Disconnect Switch', category:'Protection', description:'Visible-break isolating switch for lockout/tagout.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="18" y2="25" stroke="#1A1A1A" stroke-width="2"/><circle cx="18" cy="25" r="3" fill="#1A1A1A"/><circle cx="62" cy="25" r="3" fill="#1A1A1A"/><line x1="18" y1="25" x2="56" y2="8" stroke="#1A1A1A" stroke-width="2"/><line x1="28" y1="20" x2="28" y2="36" stroke="#1A1A1A" stroke-width="1.5"/><line x1="62" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    // ── COILS / RELAYS ─────────────────────────────────────────
    {name:'Relay Coil', category:'Coils & Relays', description:'Electromagnetic coil that actuates relay contacts.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="18" y2="25" stroke="#1A1A1A" stroke-width="2"/><rect x="18" y="12" width="44" height="26" fill="#fff" stroke="#1A1A1A" stroke-width="2"/><text x="40" y="30" text-anchor="middle" font-size="11" font-weight="bold" fill="#1A1A1A">CR</text><line x1="62" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'Contactor Coil', category:'Coils & Relays', description:'High-power electromagnet coil for motor starter contactors.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="18" y2="25" stroke="#1A1A1A" stroke-width="2"/><rect x="18" y="12" width="44" height="26" fill="#fff" stroke="#1A1A1A" stroke-width="2"/><text x="40" y="30" text-anchor="middle" font-size="11" font-weight="bold" fill="#1A1A1A">MS</text><line x1="62" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'Overload Coil', category:'Coils & Relays', description:'Thermal element that trips OL relay on motor overcurrent.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="14" y2="25" stroke="#1A1A1A" stroke-width="2"/><path d="M14,25 Q20,15 26,25 Q32,15 38,25 Q44,15 50,25" fill="none" stroke="#1A1A1A" stroke-width="2"/><line x1="50" y1="25" x2="50" y2="10" stroke="#1A1A1A" stroke-width="1.5"/><line x1="50" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/><text x="40" y="44" text-anchor="middle" font-size="8" fill="#666">OL</text></svg>'},
    // ── MACHINES ───────────────────────────────────────────────
    {name:'AC Motor', category:'Machines', description:'Converts electrical energy to rotational mechanical energy.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="14" y2="25" stroke="#1A1A1A" stroke-width="2"/><circle cx="40" cy="25" r="22" fill="#fff" stroke="#1A1A1A" stroke-width="2"/><text x="40" y="21" text-anchor="middle" font-size="14" font-weight="bold" fill="#1A1A1A">M</text><text x="40" y="34" text-anchor="middle" font-size="8" fill="#666">3\u00d8</text><line x1="62" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'DC Motor', category:'Machines', description:'DC motor with commutator. Requires DC power supply.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="14" y2="25" stroke="#1A1A1A" stroke-width="2"/><circle cx="40" cy="25" r="22" fill="#fff" stroke="#1A1A1A" stroke-width="2"/><text x="40" y="21" text-anchor="middle" font-size="14" font-weight="bold" fill="#1A1A1A">M</text><text x="40" y="34" text-anchor="middle" font-size="8" fill="#666">DC</text><line x1="62" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'Generator', category:'Machines', description:'Converts mechanical energy to electrical energy.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="14" y2="25" stroke="#1A1A1A" stroke-width="2"/><circle cx="40" cy="25" r="22" fill="#fff" stroke="#1A1A1A" stroke-width="2"/><text x="40" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#1A1A1A">G</text><line x1="62" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'Transformer (Iron Core)', category:'Machines', description:'Transfers energy between circuits via electromagnetic induction.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><path d="M10,25 Q16,13 22,25 Q28,13 34,25" fill="none" stroke="#1A1A1A" stroke-width="2"/><line x1="36" y1="8" x2="36" y2="42" stroke="#555" stroke-width="3"/><line x1="40" y1="8" x2="40" y2="42" stroke="#555" stroke-width="3"/><path d="M42,25 Q48,13 54,25 Q60,13 66,25" fill="none" stroke="#1A1A1A" stroke-width="2"/><line x1="0" y1="25" x2="10" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="66" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    // ── MEASUREMENT ────────────────────────────────────────────
    {name:'Voltmeter', category:'Measurement', description:'Measures voltage. Connected in parallel across a component.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="16" y2="25" stroke="#1A1A1A" stroke-width="2"/><circle cx="40" cy="25" r="22" fill="#fff" stroke="#1A1A1A" stroke-width="2"/><text x="40" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#1A1A1A">V</text><line x1="62" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'Ammeter', category:'Measurement', description:'Measures current. Connected in series in the circuit.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="16" y2="25" stroke="#1A1A1A" stroke-width="2"/><circle cx="40" cy="25" r="22" fill="#fff" stroke="#1A1A1A" stroke-width="2"/><text x="40" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#1A1A1A">A</text><line x1="62" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'Wattmeter', category:'Measurement', description:'Measures real power in watts. Has current and voltage coils.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="16" y2="25" stroke="#1A1A1A" stroke-width="2"/><circle cx="40" cy="25" r="22" fill="#fff" stroke="#1A1A1A" stroke-width="2"/><text x="40" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#1A1A1A">W</text><line x1="62" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'Ohmmeter', category:'Measurement', description:'Measures resistance. Circuit must be de-energized.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="16" y2="25" stroke="#1A1A1A" stroke-width="2"/><circle cx="40" cy="25" r="22" fill="#fff" stroke="#1A1A1A" stroke-width="2"/><text x="40" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#1A1A1A">\u03a9</text><line x1="62" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    // ── GROUNDING ──────────────────────────────────────────────
    {name:'Earth Ground', category:'Grounding', description:'Connection to earth potential. Safety and reference point.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="40" y1="5" x2="40" y2="22" stroke="#2E7D32" stroke-width="2"/><line x1="20" y1="22" x2="60" y2="22" stroke="#2E7D32" stroke-width="3"/><line x1="26" y1="30" x2="54" y2="30" stroke="#2E7D32" stroke-width="2.5"/><line x1="32" y1="38" x2="48" y2="38" stroke="#2E7D32" stroke-width="2"/></svg>'},
    {name:'Chassis Ground', category:'Grounding', description:'Connection to equipment chassis/enclosure. Not necessarily earth.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="40" y1="5" x2="40" y2="18" stroke="#2E7D32" stroke-width="2"/><line x1="22" y1="18" x2="58" y2="18" stroke="#2E7D32" stroke-width="3"/><line x1="28" y1="24" x2="52" y2="24" stroke="#2E7D32" stroke-width="2"/><line x1="34" y1="30" x2="46" y2="30" stroke="#2E7D32" stroke-width="2"/><line x1="28" y1="36" x2="52" y2="36" stroke="#2E7D32" stroke-width="1.5"/></svg>'},
    // ── INDICATORS ─────────────────────────────────────────────
    {name:'Pilot Light', category:'Indicators', description:'Visual status indicator. Illuminates when circuit is energized.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="16" y2="25" stroke="#1A1A1A" stroke-width="2"/><circle cx="40" cy="25" r="18" fill="#FFF9C4" stroke="#F57C00" stroke-width="2"/><circle cx="40" cy="25" r="8" fill="#FFD700" stroke="#F57C00" stroke-width="1"/><line x1="58" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    {name:'Alarm Bell', category:'Indicators', description:'Audible alert device. Sounds when circuit is energized.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="14" y2="25" stroke="#1A1A1A" stroke-width="2"/><path d="M14,10 Q40,2 66,10 L66,40 Q40,48 14,40 Z" fill="#fff" stroke="#1A1A1A" stroke-width="2"/><line x1="40" y1="36" x2="40" y2="44" stroke="#1A1A1A" stroke-width="2"/><circle cx="40" cy="46" r="3" fill="#1A1A1A"/><line x1="66" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/></svg>'},
    // ── WIRING ─────────────────────────────────────────────────
    {name:'Wire Junction', category:'Wiring', description:'Connected crossing wires. Filled dot indicates connection.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="40" y1="0" x2="40" y2="50" stroke="#1A1A1A" stroke-width="2"/><circle cx="40" cy="25" r="5" fill="#1A1A1A"/></svg>'},
    {name:'No Connection (Crossover)', category:'Wiring', description:'Crossing wires with no electrical connection. No dot.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="34" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="46" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/><path d="M40,0 Q52,20 40,25 Q28,30 40,50" fill="none" stroke="#1A1A1A" stroke-width="2"/></svg>'},

    // ── MOTOR CONTROL (from original glossary) ─────────────────
    {name:'Motor Starter (MS)', category:'Coils & Relays', description:'Electromagnetic contactor for motor control circuits. Three NO power contacts close when coil energizes, starting the motor.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="18" y2="25" stroke="#1A1A1A" stroke-width="2"/><rect x="18" y="12" width="44" height="26" fill="#fff" stroke="#1A1A1A" stroke-width="2"/><text x="40" y="29" text-anchor="middle" font-size="11" font-weight="bold" fill="#CC0000">MS</text><line x1="62" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/><line x1="27" y1="12" x2="27" y2="8" stroke="#1A1A1A" stroke-width="1.5"/><line x1="40" y1="12" x2="40" y2="8" stroke="#1A1A1A" stroke-width="1.5"/><line x1="53" y1="12" x2="53" y2="8" stroke="#1A1A1A" stroke-width="1.5"/><line x1="23" y1="8" x2="31" y2="8" stroke="#1A1A1A" stroke-width="1.5"/><line x1="36" y1="8" x2="44" y2="8" stroke="#1A1A1A" stroke-width="1.5"/><line x1="49" y1="8" x2="57" y2="8" stroke="#1A1A1A" stroke-width="1.5"/></svg>'},
    {name:'Overload Relay (OL)', category:'Protection', description:'Thermal/magnetic overload protection for motors. Trips on sustained overcurrent and resets after cooling. NC contact opens to de-energize starter.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="25" x2="12" y2="25" stroke="#1A1A1A" stroke-width="2"/><rect x="12" y="14" width="56" height="22" fill="#fff" stroke="#1A1A1A" stroke-width="2" rx="2"/><path d="M18,25 Q22,17 26,25 Q30,17 34,25 Q38,17 42,25 Q46,17 50,25 Q54,17 58,25 Q62,17 66,25" fill="none" stroke="#CC0000" stroke-width="1.8"/><line x1="68" y1="25" x2="80" y2="25" stroke="#1A1A1A" stroke-width="2"/><text x="40" y="46" text-anchor="middle" font-size="8" fill="#666">OL</text></svg>'},
    {name:'GFCI Receptacle', category:'Protection', description:'Ground Fault Circuit Interrupter. Trips at 5mA current imbalance between hot and neutral. Required in wet locations per NEC.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="5" width="50" height="40" rx="4" fill="#fff" stroke="#1A1A1A" stroke-width="2"/><ellipse cx="29" cy="20" rx="4" ry="6" fill="none" stroke="#1A1A1A" stroke-width="1.5"/><ellipse cx="51" cy="20" rx="4" ry="6" fill="none" stroke="#1A1A1A" stroke-width="1.5"/><circle cx="40" cy="30" r="4" fill="none" stroke="#2E7D32" stroke-width="1.5"/><text x="40" y="33" text-anchor="middle" font-size="4.5" fill="#2E7D32">GND</text><text x="40" y="48" text-anchor="middle" font-size="7" font-weight="bold" fill="#CC0000">GFCI</text></svg>'},
    {name:'Control Relay (CR)', category:'Coils & Relays', description:'Low-power relay used to switch control circuits. Coil energizes to open or close contacts in ladder logic control systems.',
     svg:'<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="38" x2="14" y2="38" stroke="#1A1A1A" stroke-width="2"/><rect x="14" y="28" width="28" height="18" fill="#fff" stroke="#1A1A1A" stroke-width="2"/><text x="28" y="41" text-anchor="middle" font-size="10" font-weight="bold" fill="#1A1A1A">CR</text><line x1="42" y1="38" x2="56" y2="38" stroke="#1A1A1A" stroke-width="2"/><line x1="0" y1="12" x2="24" y2="12" stroke="#1A1A1A" stroke-width="2"/><line x1="24" y1="4" x2="24" y2="20" stroke="#1A1A1A" stroke-width="2.5"/><line x1="46" y1="4" x2="46" y2="20" stroke="#1A1A1A" stroke-width="2.5"/><line x1="46" y1="12" x2="80" y2="12" stroke="#1A1A1A" stroke-width="2"/><text x="35" y="22" text-anchor="middle" font-size="7" fill="#666">CR</text></svg>'}

  ];

  ArcReady.renderSymbolGlossary = function(container) {
    if (!container) return;
    var html = '<div style="margin-bottom:8px;">'
      + '<input type="text" id="symbol-search" placeholder="\ud83d\udd0d Search symbols (name, category)..." '
      + 'style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:6px;font-size:14px;box-sizing:border-box;outline:none;font-family:inherit;"/>'
      + '</div><div class="symbol-grid" id="symbol-grid"></div>';
    container.innerHTML = html;

    function render(filter) {
      var grid = document.getElementById('symbol-grid');
      if (!grid) return;
      var fl = (filter||'').toLowerCase().trim();
      var filtered = fl ? symbols.filter(function(s){
        return s.name.toLowerCase().indexOf(fl)>=0 || s.category.toLowerCase().indexOf(fl)>=0 || s.description.toLowerCase().indexOf(fl)>=0;
      }) : symbols;
      if (!filtered.length) {
        grid.innerHTML = '<div style="color:#999;padding:24px;text-align:center;">No symbols found for &ldquo;'+filter+'&rdquo;</div>';
        return;
      }
      grid.innerHTML = filtered.map(function(sym){
        return '<div class="symbol-card">'
          + '<div class="symbol-svg-wrap">'+sym.svg+'</div>'
          + '<div class="symbol-name">'+sym.name+'</div>'
          + '<div class="symbol-category">'+sym.category+'</div>'
          + '<div class="symbol-desc">'+sym.description+'</div>'
          + '</div>';
      }).join('');
    }

    render('');
    var inp = document.getElementById('symbol-search');
    if (inp) {
      inp.addEventListener('input', function(){ render(this.value); });
      inp.addEventListener('focus', function(){ this.style.borderColor='#CC0000'; this.style.boxShadow='0 0 0 3px rgba(204,0,0,.1)'; });
      inp.addEventListener('blur',  function(){ this.style.borderColor='#ddd'; this.style.boxShadow=''; });
    }
  };

}());
