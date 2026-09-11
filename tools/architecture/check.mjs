import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import ts from "typescript";
import { POLICY, RULES, validateRules } from "./rules.mjs";

const CODE = /\.(?:[cm]?[jt]sx?)$/;
const TEST = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const DECLARATION = /\.d\.[cm]?ts$/;
const slash = (value) => value.split(path.sep).join("/");
const at = (file, prefix) =>
  prefix.endsWith("/") ? file.startsWith(prefix) : file === prefix;
const packageIs = (name, prefix) =>
  name === prefix || name.startsWith(`${prefix}/`);
const inTransport = (file) =>
  ["http", "services", "chaos", "root"].some((tier) =>
    file.startsWith(`src/lib/${tier}/`),
  );
const portableTier = (file) =>
  file.startsWith("src/lib/") &&
  Object.hasOwn(POLICY.portable, file.split("/")[2])
    ? file.split("/")[2]
    : undefined;

async function walk(directory, root, out) {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT" && directory === root) return;
    throw error;
  }
  for (const entry of entries) {
    if (
      ["node_modules", ".next", ".git", "coverage", "build", "out"].includes(
        entry.name,
      )
    )
      continue;
    const full = path.join(directory, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(`Source symlinks require review: ${full}`);
    if (entry.isDirectory()) await walk(full, root, out);
    else if (
      CODE.test(entry.name) &&
      !TEST.test(entry.name) &&
      !DECLARATION.test(entry.name)
    )
      out.push(full);
  }
}

export async function inventory(root) {
  const files = [];
  for (const dir of POLICY.roots)
    await walk(path.join(root, dir), path.join(root, dir), files);
  try {
    await fs.access(path.join(root, "proxy.ts"));
    files.push(path.join(root, "proxy.ts"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!files.length)
    throw new Error("No production sources found; nothing was checked.");
  return files.sort();
}

function git(root, args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    throw new Error(
      `Git scope could not be determined: ${String(error.stderr || error.message).trim()}`,
    );
  }
}

export function changedFiles(root, base) {
  const prefix = git(root, ["rev-parse", "--show-prefix"]).trim();
  const baseline = base
    ? git(root, ["merge-base", "HEAD", base]).trim()
    : "HEAD";
  const split = (output) => output.split("\0").filter(Boolean);
  const names = [
    ...split(
      git(root, [
        "diff",
        "--name-only",
        "--no-renames",
        "-z",
        baseline,
        "--",
        ".",
      ]),
    ),
    ...split(
      git(root, [
        "diff",
        "--cached",
        "--name-only",
        "--no-renames",
        "-z",
        "HEAD",
        "--",
        ".",
      ]),
    ),
    ...split(
      git(root, [
        "ls-files",
        "--others",
        "--exclude-standard",
        "--full-name",
        "-z",
        "--",
        ".",
      ]),
    ),
  ];
  return [
    ...new Set(
      names
        .filter((name) => name.startsWith(prefix))
        .map((name) => name.slice(prefix.length)),
    ),
  ].sort();
}

function location(file, node) {
  const { line, character } = file.source.getLineAndCharacterOfPosition(
    node.getStart(file.source),
  );
  return { file: file.name, line: line + 1, column: character + 1 };
}

function directives(body) {
  const values = [];
  for (const statement of body.statements || []) {
    if (
      !ts.isExpressionStatement(statement) ||
      !ts.isStringLiteral(statement.expression)
    )
      break;
    values.push(statement.expression.text);
  }
  return values;
}

function references(source, checker) {
  const result = [],
    dynamic = [];
  function visit(node) {
    let literal;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      literal = node.moduleSpecifier;
    else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    )
      literal = node.moduleReference.expression;
    else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
      literal = node.argument.literal;
    else if (ts.isCallExpression(node)) {
      const isRequire =
        ts.isIdentifier(node.expression) &&
        node.expression.text === "require" &&
        !(
          checker.getSymbolAtLocation(node.expression)?.declarations || []
        ).some((decl) => !decl.getSourceFile().isDeclarationFile);
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword || isRequire) {
        if (
          node.arguments[0] &&
          (ts.isStringLiteral(node.arguments[0]) ||
            ts.isNoSubstitutionTemplateLiteral(node.arguments[0]))
        )
          literal = node.arguments[0];
        else dynamic.push(node);
      }
    }
    if (
      literal &&
      (ts.isStringLiteral(literal) ||
        ts.isNoSubstitutionTemplateLiteral(literal))
    )
      result.push({ specifier: literal.text, node: literal });
    ts.forEachChild(node, visit);
  }
  visit(source);
  return { imports: result, dynamic };
}

function nameOf(node) {
  if (
    node?.name &&
    (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))
  )
    return node.name.text;
  if (
    node &&
    (ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node) ||
      ts.isFunctionTypeNode(node))
  )
    return nameOf(node.parent);
}
function sourceName(root, node) {
  return node ? slash(path.relative(root, node.getSourceFile().fileName)) : "";
}

function resultIn(type, checker, root, seen = new Set(), depth = 0) {
  const symbols = [type.aliasSymbol, type.getSymbol?.()].filter(Boolean);
  if (
    symbols.some(
      (symbol) =>
        ["Result", "Ok", "Err"].includes(symbol.name) &&
        symbol.declarations?.some(
          (node) => sourceName(root, node) === "src/lib/kernel/result.ts",
        ),
    )
  )
    return { found: true, gaps: [] };
  if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown))
    return { found: false, gaps: ["any/unknown return data"] };
  if (depth > 12 || seen.size > 300)
    return { found: false, gaps: ["return type inspection limit"] };
  if (seen.has(type)) return { found: false, gaps: ["recursive return data"] };
  if (
    !(
      type.flags &
      (ts.TypeFlags.Object |
        ts.TypeFlags.Union |
        ts.TypeFlags.Intersection |
        ts.TypeFlags.TypeParameter)
    )
  )
    return { found: false, gaps: [] };
  const nextSeen = new Set(seen).add(type),
    nested = [];
  if (type.isUnionOrIntersection()) nested.push(...type.types);
  else if (type.flags & ts.TypeFlags.TypeParameter) {
    const constraint = checker.getBaseConstraintOfType(type);
    if (constraint) nested.push(constraint);
    else return { found: false, gaps: ["unconstrained return type"] };
  } else {
    const awaited = checker.getPromisedTypeOfPromise(type);
    if (awaited) nested.push(awaited);
    else if (checker.isArrayType(type) || checker.isTupleType(type))
      nested.push(...checker.getTypeArguments(type));
    else {
      if (type.getCallSignatures().length)
        return { found: false, gaps: ["callable return data"] };
      for (const property of type.getProperties()) {
        const declaration =
          property.valueDeclaration || property.declarations?.[0];
        if (declaration)
          nested.push(checker.getTypeOfSymbolAtLocation(property, declaration));
      }
      const index = checker.getIndexTypeOfType(type, ts.IndexKind.String);
      if (index) nested.push(index);
    }
  }
  const results = nested.map((child) =>
    resultIn(child, checker, root, nextSeen, depth + 1),
  );
  return {
    found: results.some((result) => result.found),
    gaps: [...new Set(results.flatMap((result) => result.gaps))],
  };
}

function serverFunctions(file, checker) {
  const found = [];
  if (directives(file.source).includes("use server")) {
    const moduleSymbol = checker.getSymbolAtLocation(file.source);
    for (let symbol of moduleSymbol
      ? checker.getExportsOfModule(moduleSymbol)
      : []) {
      const exported = symbol;
      if (symbol.flags & ts.SymbolFlags.Alias)
        symbol = checker.getAliasedSymbol(symbol);
      const declaration = symbol.valueDeclaration || symbol.declarations?.[0];
      if (!declaration) continue;
      for (const signature of checker
        .getTypeOfSymbolAtLocation(symbol, declaration)
        .getCallSignatures()) {
        const site =
          exported.declarations?.find(
            (node) => node.getSourceFile() === file.source,
          ) ||
          (declaration.getSourceFile() === file.source
            ? declaration
            : file.source);
        found.push({ node: site, signature });
      }
    }
  }
  function visit(node) {
    if (
      ts.isFunctionLike(node) &&
      node.body &&
      ts.isBlock(node.body) &&
      directives(node.body).includes("use server")
    ) {
      const signature = checker.getSignatureFromDeclaration(node);
      if (signature) found.push({ node, signature });
    }
    ts.forEachChild(node, visit);
  }
  visit(file.source);
  return found;
}

const DETECTORS = {
  S1(file, ctx) {
    if (!portableTier(file.name)) return false;
    for (const reference of file.imports)
      if (
        POLICY.frameworks.some((prefix) =>
          packageIs(reference.specifier, prefix),
        )
      )
        ctx.violate(reference.node, reference.specifier);
    if (
      directives(file.source).some((value) =>
        ["use client", "use server"].includes(value),
      )
    )
      ctx.violate(
        file.source.statements[0],
        "framework directive in portable code",
      );
    return true;
  },
  S2(file, ctx) {
    const tier = portableTier(file.name);
    if (!tier) return false;
    for (const reference of file.imports) {
      if (
        reference.outsideProject ||
        (reference.target && !reference.specifier.startsWith(".")) ||
        reference.specifier.startsWith("~/")
      )
        ctx.violate(reference.node, reference.specifier);
      else if (reference.target) {
        const targetTier = reference.target.startsWith("src/lib/")
          ? reference.target.split("/")[2]
          : undefined;
        if (!POLICY.portable[tier].includes(targetTier))
          ctx.violate(reference.node, reference.target);
      }
    }
    return true;
  },
  S3(file, ctx) {
    for (const reference of file.imports) {
      const owners = POLICY.libraryOwners.filter((owner) =>
        owner.packages.some((prefix) => packageIs(reference.specifier, prefix)),
      );
      if (
        owners.length &&
        !owners.some((owner) =>
          owner.paths.some((prefix) => at(file.name, prefix)),
        )
      )
        ctx.violate(reference.node, reference.specifier);
    }
    return true;
  },
  S4(file, ctx) {
    if (!file.name.startsWith("src/components/")) return false;
    for (const reference of file.imports)
      if (
        reference.target &&
        (reference.target.startsWith("src/examples/") ||
          reference.target.startsWith("src/routes/") ||
          (reference.target.startsWith("src/lib/") &&
            !reference.target.startsWith("src/lib/kernel/")))
      )
        ctx.violate(reference.node, reference.target);
    return true;
  },
  S5(file, ctx) {
    if (
      file.name.startsWith("src/lib/root/") ||
      file.name.startsWith("src/lib/http/")
    )
      return false;
    for (const call of file.calls) {
      const declaration = ctx.checker.getResolvedSignature(call)?.declaration;
      if (
        sourceName(ctx.root, declaration).startsWith("src/lib/http/") &&
        ["createFetchClient", "createMemoryClient"].includes(
          nameOf(declaration),
        )
      )
        ctx.violate(call, nameOf(declaration));
    }
    return true;
  },
  S6(file, ctx) {
    if (inTransport(file.name)) return false;
    for (const call of file.calls) {
      const declaration = ctx.checker.getResolvedSignature(call)?.declaration;
      const origin = sourceName(ctx.root, declaration),
        name = nameOf(declaration);
      const httpMethod =
        origin === "src/lib/http/port.ts" &&
        ["get", "post", "put", "patch", "delete", "request"].includes(name);
      const nativeFetch =
        name === "fetch" &&
        /(?:typescript\/lib\/lib\.dom\.d\.ts|undici-types\/fetch\.d\.ts|@types\/node\/.*\.d\.ts)$/.test(
          origin,
        );
      if (httpMethod || nativeFetch)
        ctx.violate(call, httpMethod ? `HttpClient.${name}` : "native fetch");
    }
    return true;
  },
  E1(file, ctx) {
    const functions = serverFunctions(file, ctx.checker);
    for (const fn of functions) {
      const result = resultIn(
        ctx.checker.getReturnTypeOfSignature(fn.signature),
        ctx.checker,
        ctx.root,
      );
      if (result.found)
        ctx.violate(fn.node, "Result/Ok/Err in server-function return data");
      else
        for (const gap of result.gaps)
          ctx.lead("E2", fn.node, `Serialization needs review: ${gap}.`);
    }
    return functions.length > 0;
  },
  A1(file, ctx) {
    if (!/\.[jt]sx$/.test(file.name)) return false;
    if (file.name === "src/entry-server.tsx") return true;
    function visit(node) {
      if (
        ts.isJsxAttribute(node) &&
        node.name.getText() === "suppressHydrationWarning"
      )
        ctx.violate(node, "hydration suppression");
      if (
        ts.isJsxSpreadAttribute(node) &&
        ts.isObjectLiteralExpression(node.expression)
      )
        for (const property of node.expression.properties) {
          if (nameOf(property) === "suppressHydrationWarning")
            ctx.violate(property, "hydration suppression in a literal spread");
        }
      ts.forEachChild(node, visit);
    }
    visit(file.source);
    return true;
  },
};

function reviewLeads(files, selected, catalog, lead) {
  const known = new Set(catalog.map((item) => item.name));
  const controls = {
    button: "Button",
    input: "Input",
    textarea: "Textarea",
    select: "Select",
    dialog: "Dialog",
  };
  const shapes = new Map();
  for (const file of files) {
    for (const node of file.dynamic)
      if (selected.has(file.name))
        lead(
          "C2",
          file,
          node,
          "Computed module reference: inspect the dependency manually.",
        );
    function visit(node) {
      if (selected.has(file.name)) {
        if (ts.isCatchClause(node))
          lead(
            "E2",
            file,
            node,
            "Trace this catch to the caller's failure state and recovery; a catch is not itself a defect.",
          );
        if (
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          node.expression.name.text === "unwrapOr"
        )
          lead(
            "E2",
            file,
            node,
            "Check whether this fallback preserves the distinction between failure, empty, and unmeasured.",
          );
        if (
          (file.name.startsWith("src/routes/") ||
            file.name.startsWith("src/examples/") ||
            file.name.startsWith("src/components/patterns/")) &&
          (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node))
        ) {
          const tag = node.tagName.getText(),
            candidate = controls[tag];
          const hidden =
            tag === "input" &&
            node.attributes.properties.some(
              (prop) =>
                ts.isJsxAttribute(prop) &&
                prop.name.getText() === "type" &&
                prop.initializer &&
                ts.isStringLiteral(prop.initializer) &&
                prop.initializer.text === "hidden",
            );
          if (candidate && known.has(candidate) && !hidden)
            lead(
              "C1",
              file,
              node,
              `Native <${tag}> has an existing ${candidate} wrapper. Compare contracts; native markup may be intentional.`,
              { candidate },
            );
        }
      }
      // Examples intentionally repeat structures to show independent states.
      if (!file.name.includes("/(dev)/") && ts.isJsxElement(node)) {
        const tags = [];
        function collect(child) {
          if (
            ts.isJsxOpeningElement(child) ||
            ts.isJsxSelfClosingElement(child)
          )
            tags.push(
              `${child.tagName.getText()}:${child.attributes.properties
                .map((prop) => prop.name?.getText() || "...")
                .sort()
                .join(",")}`,
            );
          ts.forEachChild(child, collect);
        }
        collect(node);
        if (tags.length >= 8 && tags.length <= 40) {
          const shape = tags.join("|");
          if (!shapes.has(shape)) shapes.set(shape, []);
          shapes.get(shape).push({ file, node, count: tags.length });
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(file.source);
  }
  const pairs = new Set();
  for (const occurrences of shapes.values()) {
    if (new Set(occurrences.map((item) => item.file.name)).size < 2) continue;
    const changed = occurrences.find((item) => selected.has(item.file.name));
    if (!changed) continue;
    const other = occurrences.find(
      (item) => item.file.name !== changed.file.name,
    );
    const key = [changed.file.name, other.file.name].sort().join("|");
    if (pairs.has(key)) continue;
    pairs.add(key);
    lead(
      "C1",
      changed.file,
      changed.node,
      "Similar JSX structure exists elsewhere. Compare ownership and reasons to change before extracting.",
      { related: location(other.file, other.node), elements: changed.count },
    );
  }
}

function componentCatalog(files, checker, root) {
  const catalog = [];
  for (const file of files.filter((file) =>
    /^src\/components\/[^/]+\/index\.[jt]s$/.test(file.name),
  )) {
    const moduleSymbol = checker.getSymbolAtLocation(file.source);
    for (let symbol of moduleSymbol
      ? checker.getExportsOfModule(moduleSymbol)
      : []) {
      const name = symbol.name;
      if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) continue;
      if (symbol.flags & ts.SymbolFlags.Alias)
        symbol = checker.getAliasedSymbol(symbol);
      const declaration = symbol.valueDeclaration || symbol.declarations?.[0];
      if (
        declaration &&
        checker
          .getTypeOfSymbolAtLocation(symbol, declaration)
          .getCallSignatures().length
      )
        catalog.push({
          name,
          importFrom: `~/${file.name.slice(4).replace(/\/index\.[jt]s$/, "")}`,
          declaration: sourceName(root, declaration),
        });
    }
  }
  return catalog.sort((a, b) => a.name.localeCompare(b.name));
}

/** @param {{root?: string, all?: boolean, base?: string, rules?: import('./rules.mjs').Rule[], policy?: typeof POLICY}} [options] */
export async function checkArchitecture({
  root = process.cwd(),
  all = false,
  base,
  rules = RULES,
  policy = POLICY,
} = {}) {
  root = path.resolve(root);
  validateRules(rules, policy, Object.keys(DETECTORS));
  // Alternate policy injection is deliberately unsupported: exceptions must
  // come from the checked-in rulebook rather than a hidden per-run override.
  if (policy !== POLICY)
    throw new Error(
      "Edit the versioned policy in rules.mjs; per-run policy overrides are unsupported.",
    );
  const names = await inventory(root),
    relativeNames = names.map((name) => slash(path.relative(root, name)));
  const changes = all ? [] : changedFiles(root, base);
  const policyChanged = changes.some((name) =>
    /^(?:tools\/architecture\/|protocols\/|package(?:-lock)?\.json$|tsconfig\.json$|eslint\.config\.|CLAUDE\.md$|AGENTS\.md$)/.test(
      name,
    ),
  );
  const deleted = changes.filter(
    (name) =>
      CODE.test(name) &&
      !TEST.test(name) &&
      !DECLARATION.test(name) &&
      (POLICY.roots.some((dir) => name.startsWith(`${dir}/`)) ||
        name === "proxy.ts") &&
      !relativeNames.includes(name),
  );
  const expanded = !all && (policyChanged || deleted.length > 0);
  const selected = new Set(
    all || expanded
      ? relativeNames
      : relativeNames.filter((name) => changes.includes(name)),
  );

  const configPath = path.join(root, "tsconfig.json"),
    config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error)
    throw new Error(
      ts.flattenDiagnosticMessageText(config.error.messageText, "\n"),
    );
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  if (parsed.errors.length)
    throw new Error(
      parsed.errors
        .map((error) =>
          ts.flattenDiagnosticMessageText(error.messageText, "\n"),
        )
        .join("\n"),
    );
  // Read explicitly: a permission error must not be mistaken for an empty file.
  await Promise.all(names.map((name) => fs.readFile(name, "utf8")));
  const declarations = parsed.fileNames.filter((name) =>
    DECLARATION.test(name),
  );
  const program = ts.createProgram([...names, ...declarations], {
    ...parsed.options,
    noEmit: true,
    incremental: false,
  });
  const checker = program.getTypeChecker();
  const files = names.map((absolute, index) => {
    const source = program.getSourceFile(absolute);
    if (!source) throw new Error(`TypeScript did not load ${absolute}`);
    const refs = references(source, checker),
      calls = [];
    function visit(node) {
      if (ts.isCallExpression(node)) calls.push(node);
      ts.forEachChild(node, visit);
    }
    visit(source);
    return {
      name: relativeNames[index],
      source,
      calls,
      dynamic: refs.dynamic,
      imports: refs.imports.map((reference) => {
        const resolved = ts.resolveModuleName(
          reference.specifier,
          absolute,
          parsed.options,
          ts.sys,
        ).resolvedModule;
        const target = resolved
          ? slash(path.relative(root, resolved.resolvedFileName))
          : undefined;
        return {
          ...reference,
          outsideProject:
            target?.startsWith("../") && !resolved.isExternalLibraryImport,
          target:
            target &&
            !target.startsWith("../") &&
            !target.startsWith("node_modules/")
              ? target
              : undefined,
        };
      }),
    };
  });
  // A helper's inferred return type can change an unchanged server function.
  // Follow reverse edges through barrels before applying typed detectors.
  const affected = [];
  let grew = true;
  while (grew) {
    grew = false;
    for (const file of files)
      if (
        !selected.has(file.name) &&
        file.imports.some((reference) => selected.has(reference.target))
      ) {
        selected.add(file.name);
        affected.push(file.name);
        grew = true;
      }
  }
  const diagnostics = [
    ...program.getOptionsDiagnostics(),
    ...program.getGlobalDiagnostics(),
    ...files.flatMap((file) => [
      ...program.getSyntacticDiagnostics(file.source),
      ...program.getSemanticDiagnostics(file.source),
    ]),
  ].filter((error) => error.category === ts.DiagnosticCategory.Error);
  const findings = [],
    leads = [],
    appliedExceptions = [];
  const lead = (rule, file, node, message, extra = {}) =>
    leads.push({
      rule,
      status: "needs_review",
      ...location(file, node),
      message,
      confidence: "review_required",
      ...extra,
    });
  const checks = rules
    .filter((rule) => rule.mode === "mechanical")
    .map((rule) => {
      if (rule.disabledReason)
        return {
          id: rule.id,
          status: "not_checked",
          files: 0,
          reason: rule.disabledReason,
        };
      if (diagnostics.length)
        return {
          id: rule.id,
          status: "not_checked",
          files: 0,
          reason:
            "TypeScript verification failed; fix the reported diagnostics before relying on these detectors.",
        };
      let eligible = 0;
      for (const file of files.filter((file) => selected.has(file.name))) {
        const ctx = {
          root,
          checker,
          lead: (id, node, message) => lead(id, file, node, message),
          violate: (node, evidence) => {
            const exception = POLICY.exceptions.find(
              (exception) =>
                exception.rule === rule.id &&
                at(file.name, exception.path) &&
                at(evidence, exception.target),
            );
            if (exception) {
              appliedExceptions.push({
                ...exception,
                ...location(file, node),
                evidence,
              });
              return;
            }
            findings.push({
              rule: rule.id,
              status: "violation",
              ...location(file, node),
              message: rule.message,
              evidence,
              confidence: "detector",
            });
          },
        };
        if (DETECTORS[rule.id](file, ctx)) eligible++;
      }
      return {
        id: rule.id,
        status: findings.some((finding) => finding.rule === rule.id)
          ? "violation"
          : eligible
            ? "verified"
            : "not_checked",
        files: eligible,
        reason: eligible
          ? undefined
          : "No eligible production files in this scope.",
      };
    });
  const catalog = componentCatalog(files, checker, root);
  reviewLeads(files, selected, catalog, lead);
  const context = new Set();
  for (const file of files)
    for (const reference of file.imports) {
      if (
        selected.has(file.name) &&
        reference.target &&
        !selected.has(reference.target)
      )
        context.add(reference.target);
      if (
        reference.target &&
        selected.has(reference.target) &&
        !selected.has(file.name)
      )
        context.add(file.name);
    }
  const reviewFiles = [
    ...new Set([
      ...selected,
      ...changes.filter((name) => name.endsWith(".css")),
    ]),
  ].sort();
  const review = rules
    .filter((rule) => rule.mode === "review")
    .map((rule) => ({
      id: rule.id,
      status:
        rule.disabledReason || !reviewFiles.length
          ? "not_checked"
          : "needs_review",
      reason:
        rule.disabledReason ||
        (reviewFiles.length
          ? "Requires the contextual review in tools/architecture/REVIEW.md."
          : "No changed production source or stylesheet to review."),
    }));
  const report = {
    version: 1,
    status: diagnostics.length
      ? "incomplete"
      : findings.length
        ? "violations"
        : reviewFiles.length
          ? "review_pending"
          : "no_changes",
    scope: {
      requested: all ? "all" : "changed",
      content: "working_tree",
      base: base || (all ? null : "HEAD"),
      expandedToAll: expanded,
      reason: expanded
        ? "Policy/configuration changes or source deletions require a full source check."
        : undefined,
      inventory: files.length,
      inspected: selected.size,
      files: [...selected].sort(),
      changed: changes,
      affected: affected.sort(),
      deleted,
      reviewFiles,
      context: [...context].sort(),
    },
    checks,
    findings,
    review,
    leads,
    catalog,
    exceptions: {
      applied: appliedExceptions,
      unused: POLICY.exceptions.filter(
        (exception) =>
          !appliedExceptions.some(
            (applied) =>
              applied.rule === exception.rule &&
              applied.path === exception.path &&
              applied.target === exception.target,
          ),
      ),
    },
    diagnostics: diagnostics.map((error) => ({
      code: error.code,
      file: error.file
        ? slash(path.relative(root, error.file.fileName))
        : configPath,
      line:
        error.file && error.start !== undefined
          ? error.file.getLineAndCharacterOfPosition(error.start).line + 1
          : undefined,
      message: ts.flattenDiagnosticMessageText(error.messageText, "\n"),
    })),
    notRun: [
      "Build and bundle verification",
      "Behavioral and blind spec tests",
      "Browser, accessibility, and assistive-technology checks",
    ],
    rulebook: rules,
    policy: POLICY,
  };
  return report;
}

export function exitCode(report) {
  return report.status === "incomplete" ? 2 : report.findings.length ? 1 : 0;
}

export function formatReport(report) {
  const lines = [
    `Flover architecture — ${report.status}`,
    `${report.scope.inspected}/${report.scope.inventory} working-tree production sources inspected (${report.scope.requested}${report.scope.expandedToAll ? "; expanded to all" : ""}).`,
  ];
  if (report.scope.reason) lines.push(report.scope.reason);
  if (report.scope.affected.length)
    lines.push(
      `Includes ${report.scope.affected.length} affected importers, followed through local re-exports.`,
    );
  const statement = (id) =>
    report.rulebook.find((rule) => rule.id === id).statement;
  for (const check of report.checks)
    lines.push(
      `${check.status.toUpperCase().padEnd(13)} ${check.id} — ${statement(check.id)} (${check.files} files)${check.reason ? `; ${check.reason}` : ""}`,
    );
  for (const finding of report.findings)
    lines.push(
      `\n${finding.rule} ${finding.file}:${finding.line}:${finding.column}\n  ${finding.message}\n  Evidence: ${finding.evidence}`,
    );
  for (const diagnostic of report.diagnostics)
    lines.push(
      `\nNOT_CHECKED TS${diagnostic.code} ${diagnostic.file}:${diagnostic.line || 1}\n  ${diagnostic.message}`,
    );
  for (const item of report.review)
    lines.push(
      `${item.status.toUpperCase().padEnd(13)} ${item.id} — ${statement(item.id)} ${item.reason}`,
    );
  for (const item of report.leads)
    lines.push(
      `  ${item.rule} ${item.file}:${item.line} — ${item.message}${item.related ? ` See ${item.related.file}:${item.related.line}.` : ""}`,
    );
  lines.push(
    `\n${report.catalog.length} public components available for reuse; use --json for their imports and the complete rulebook.`,
  );
  lines.push(
    `Exceptions: ${report.exceptions.applied.length} applied; ${report.exceptions.unused.length} unused in this scope.`,
  );
  for (const item of report.exceptions.applied)
    lines.push(`  ${item.rule} ${item.file}:${item.line} — ${item.reason}`);
  for (const item of report.exceptions.unused)
    lines.push(
      `  UNUSED ${item.rule} ${item.path} → ${item.target} — ${item.reason}`,
    );
  lines.push(`NOT_CHECKED   ${report.notRun.join("; ")}.`);
  lines.push(
    "Exit 0 covers mechanical checks only. Complete contextual review with tools/architecture/REVIEW.md.",
  );
  return lines.join("\n");
}
