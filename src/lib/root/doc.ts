/**
 * root — the composition root, and the only file that picks an adapter.
 *
 *     root  may import  everything below it
 *     root  ✗ imported by anything except src/routes
 *
 * Every other tier is written so that this one file is the only place a choice
 * is made. `services` takes the client rather than importing one precisely so
 * the decision lands here; this is where it is collected.
 *
 * # It TAKES what it needs; it does not read it
 *
 * No environment variable, no cookie, no query string. `createRoot` is a
 * function of its arguments, and that is what keeps this tier framework-free —
 * so it travels to the sibling templates unchanged.
 *
 * Reading a cookie is a framework's job and differs in every one of them.
 * Pushing that read up into the caller means the difference between the
 * templates is a few lines in a route handler rather than a rewritten tier.
 *
 * # One root per INTERACTION, not per request
 *
 * This is the whole reason the correlation id is worth carrying. A click that
 * fans out into four requests is one interaction, and all four failures name
 * it. Build a root per request instead and the id degenerates into a second
 * request id — the same information twice, under two names.
 *
 * `lib/runtime`'s `beginInteraction` mints one; the caller hands it here.
 *
 * # A `Root` is four facts, and three of them are for the screen
 *
 *     client          the only thing services take
 *     correlationId   what every failure from this root will name
 *     usingFixtures   transport-level PROVENANCE
 *     underChaos      whether the states you are seeing were forced
 *
 * `usingFixtures` matters because *nobody looked* and *a fixture answered* are
 * different claims, and a screen that cannot distinguish them will make the
 * more flattering one. `underChaos` matters for the same reason from the other
 * side: a forced failure that looks real is an afternoon somebody spends
 * chasing it.
 *
 * # The route table is empty, and that is the honest state
 *
 * There is no domain in a template, so there is nothing a fixture could
 * reproduce. Every request comes back as an unserved route rather than as a
 * plausible answer — *this fixture was never asked*, which is what
 * `lib/http`'s adapters spec means by refusing to call it a 404.
 *
 * # Deliberately absent
 *
 * **A `SERVED` list.** Graduating domain-by-domain as a backend grows is real
 * and belongs to a product, not to a template with no domains. When it exists
 * it is one array here and a startup line that prints it, so *is this screen
 * real* needs no investigation.
 *
 * **A provider.** Handing a root down a component tree is a framework's
 * question. This tier makes one; where it is put is above.
 */
export {};
