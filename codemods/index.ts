import * as jscodeshift from "jscodeshift";
import { migrate, MigrateConfig, Plugin, PluginParams } from "ts-migrate-server";
import { resolve } from "path";
import { fileURLToPath } from 'url';
import { writeFile, readFileSync } from 'fs';

const inputPath = resolve(__dirname, "../3Dmol");
const configPath = resolve(__dirname);

const j = jscodeshift.withParser("js");
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



const unwrapIffePlugin: Plugin = {
    name: "unwrap_iffe",
    async run({ text }: PluginParams) {
        const root = j(text);
    }
}

const text = readFileSync(resolve(inputPath, "specs.js"), "utf8");
const ast = j(text);
const getFirstNode = () => ast.find(j.Program).get('body', 0).node;



let global_iffe = ast
    .find(j.ExpressionStatement, isIifeExpression)
    .filter((ast) => ast.parent.name === "program")

//convert to function Declaration default export
global_iffe.forEach(ast => {
    const { callee } = ast.node.expression as jscodeshift.CallExpression;
    const { body, comments: globalComments } = callee as jscodeshift.FunctionExpression;
    const { body: fnBody, comments: fnComments } = body as jscodeshift.BlockStatement;
    ast.insertBefore(globalComments?.concat(fnComments));
    console.log(fnComments)
    ast.replace(fnBody.body)
});

ast // remove 'use strict'
    .find(j.ExpressionStatement, isUseStrictExpression)
    .forEach(ast => j(ast).remove());

ast //remove global return expressions (which appears after unwrapping from IIFE)
    .find(j.ReturnStatement)
    .filter((ast) => ast.scope.isGlobal())
    .forEach(ast => j(ast).remove());





writeFile(resolve(configPath, "specs.js"), ast.toSource(), () => console.log("done"));







// const codemod = async () => migrate({
//     rootDir: inputPath,
//     tsConfigDir: configPath,
//     config: new MigrateConfig().addPlugin(unwrapIffePlugin, {}),
// }) 

// codemod();