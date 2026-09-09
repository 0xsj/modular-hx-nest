/**
 * DensityToggle — the token override, over `lib/runtime`.
 *
 * # It changes tokens, not components
 *
 * Density is a spacing scale, applied at the root as a data attribute the
 * token layer reads. No component knows about it, and none should: a
 * component that checked the density would be making a layout decision on
 * behalf of a screen, which is the thing the token tier exists to prevent.
 *
 * That is what makes it removable. Delete this control and the token default
 * still applies; delete the attribute from the token layer and nothing else
 * has to change.
 *
 * # A separate component from the theme control, deliberately
 *
 * Same shape, different store, and very different likelihood of being wanted:
 * many products offer a theme and no density at all. Keeping them apart means
 * deleting one is deleting one file rather than editing a configuration object
 * that describes both.
 *
 * # Two options, and no `system`
 *
 * Unlike the theme, there is no platform preference to follow — the OS has no
 * opinion about how tight a table should be. So two states here is the honest
 * count, and adding a third to match the theme control would be symmetry for
 * its own sake.
 */
export {};
