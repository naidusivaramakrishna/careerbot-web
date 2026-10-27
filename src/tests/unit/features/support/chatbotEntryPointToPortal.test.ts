import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

/**
 * Permanent regression guard: the chatbot widget (ChatApp.tsx) must call
 * router.push to the guest ticket portal (/support/tickets/new) -- its
 * "Raise a support ticket" link (input footer) and the contextual
 * "Raise a support ticket →" link shown after a 👎 unhelpful answer both
 * go there via redirectToTicketPage. Without this, those entry points
 * would fall back to the in-widget modal (openTicketModal/submitTicket,
 * left in place but otherwise unused) or, if that were ever removed too,
 * do nothing at all.
 *
 * Parses ChatApp.tsx as a real TypeScript AST (ts.createSourceFile) and
 * walks CallExpression nodes for `router.push(...)`, reading the first
 * argument whether it's a plain string or a template literal -- rather
 * than matching text with a regex. A regex over raw source text cannot
 * tell code from comments or string/template contents (a `/*` inside an
 * unrelated string literal would make a naive comment-stripper eat real
 * code), so this reads the destination from the parsed call site itself.
 *
 * fs.readFileSync and ts.createSourceFile run directly in the test body,
 * not inside any expected-failure wrapper -- if ChatApp.tsx is ever
 * renamed or moved, this throws and the test genuinely fails, instead of
 * a missing-file error being swallowed as a "pass".
 */
function routerPushDestinations(sourceFile: ts.SourceFile): string[] {
  const destinations: string[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'router' &&
      node.expression.name.text === 'push'
    ) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteralLike(arg)) {
        destinations.push(arg.text);
      } else if (arg && ts.isTemplateExpression(arg)) {
        // `/support/tickets/new${query ? ... : ''}` -- the literal part
        // before the first `${...}` is enough to identify the route.
        destinations.push(arg.head.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return destinations;
}

describe('chatbot widget -- entry point to the ticket portal', () => {
  it('ChatApp.tsx calls router.push to the guest ticket portal or dashboard support history', () => {
    const chatAppPath = path.join(
      process.cwd(),
      'src/app/(ai)/chatbot/_components/ChatApp.tsx',
    );
    const sourceText = fs.readFileSync(chatAppPath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      chatAppPath,
      sourceText,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true,
      ts.ScriptKind.TSX,
    );
    const destinations = routerPushDestinations(sourceFile);
    const hasEntryPoint = destinations.some(
      (d) => d.startsWith('/support/tickets/new') || d.startsWith('/dashboard/support-history'),
    );
    expect(hasEntryPoint).toBe(true);
  });
});
