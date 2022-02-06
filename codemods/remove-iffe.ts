import { ASTNode } from "ast-types";
import jscodeshift, { Collection } from "jscodeshift";

export function RemoveIife<T = any>(ast: Collection<T>, j: ReturnType<typeof jscodeshift.withParser>): Collection<T> {
  const getFirstNode = () => ast.find(j.Program).get('body', 0).node;


  // Save the comments attached to the first node
  const firstNode = getFirstNode();
  const { comments } = firstNode;

  ast
    .find(j.CallExpression, isIifeExpression)
    .filter((ast) => ast.scope.isGlobal())
    .forEach(ast => {
      // @ts-expect-error
      j(ast).replaceWith(ast.node.callee.body.body);
    });

  ast // remove 'use strict'
    .find(j.ExpressionStatement, isUseStrictExpression)
    .forEach(ast => j(ast).remove());

  ast //remove global return expressions (which appears after unwrapping from IIFE)
    .find(j.ReturnStatement)
    .filter((ast) => ast.scope.isGlobal())
    .forEach(ast => j(ast).remove());

  // If the first node has been modified or deleted, reattach the comments
  const firstNode2 = getFirstNode();
  if (firstNode2 !== firstNode) {
    firstNode2.comments = comments;
  }

  return ast
};

function isIifeExpression(node: any) {
  return node.expression &&
    node.expression.type === "CallExpression" &&
    node.expression.callee.type === "FunctionExpression";
}

function isUseStrictExpression(node: any) {
  return (
    node.type === "ExpressionStatement" && node.expression && node.expression.value === "use strict"
  );
}