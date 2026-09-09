/* Forwards, deliberately. The SET is declared once, in `icon.ts`, and a barrel
   that restated it would be a second list to keep in step — at which point the
   surface is no longer countable, it is three lists that can disagree. The
   "name every export" rule belongs to the seam that imports the library, not
   to the barrels above it. */
export * from "./icon";
