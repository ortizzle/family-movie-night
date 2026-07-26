/* Family Movie Night — fmn/boot.js
   Startup: theme, seed data, first render, first sync. Must load last.

   These files load in a fixed order from index.html and share one global
   scope, exactly as the single inline script did. Order matters: boot.js
   runs the startup calls and must stay last. */

applyTheme();
applyMotion();
seedSample();
seedProfiles();
seedRotation();
render();
pullSync(true); // pick up the family's latest entries on launch (no-op until sync is set up)
