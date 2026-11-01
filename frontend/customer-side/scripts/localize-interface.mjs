import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as types from '@babel/types';
import { filipino } from '../src/i18n/translations.js';
const traverse = traverseModule.default || traverseModule;
const generate = generateModule.default || generateModule;
const root = path.resolve('src');
const excluded = new Set(['Account.jsx','AccountProfile.jsx','AccountSettings.jsx','HelpCenter.jsx','SupportChat.jsx','Disputes.jsx','EvidencePicker.jsx','BookingSharing.jsx','CustomerLayout.jsx','CustomerHeading.jsx']);
const attrs = new Set(['title','label','subtitle','placeholder','aria-label','alt','hint','eyebrow']);
const values = new Set();
function walk(directory) { return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(directory,entry.name)) : [path.join(directory,entry.name)]); }
const files = walk(root).filter(file => file.endsWith('.jsx') && !excluded.has(path.basename(file)) && /[\\/](pages|components)[\\/]/.test(file));
for (const file of files) {
  const ast = parse(fs.readFileSync(file,'utf8'), { sourceType:'module', plugins:['jsx'] });
  const existing = ast.program.body.find(node => types.isImportDeclaration(node) && node.specifiers.some(item => item.local.name === 'tr'));
  if (existing && !process.argv.includes('--dynamic') && !process.argv.includes('--spacing')) {
    traverse(ast, { CallExpression(p) { if (p.node.callee.name === 'tr' && types.isStringLiteral(p.node.arguments[0])) values.add(p.node.arguments[0].value); } });
    continue;
  }
  let changed = false;
  let templates = false;
  const wrap = value => { values.add(value); changed = true; return types.callExpression(types.identifier('tr'), [types.stringLiteral(value)]); };
  traverse(ast, {
    JSXExpressionContainer(p) {
      if (!process.argv.includes('--dynamic')) return;
      if (p.parentPath.isJSXAttribute() && !attrs.has(p.parent.name.name)) return;
      const node = p.node.expression;
      if (types.isIdentifier(node) && ['title','subtitle','label','description','hint','error','message','notice'].includes(node.name)) { p.node.expression = types.callExpression(types.identifier('tr'),[node]); changed = true; }
    },
    TemplateLiteral(p) {
      if (!process.argv.includes('--dynamic')) return;
      let parent = p.parentPath;
      while (parent && !parent.isJSXExpressionContainer()) { if (parent.isCallExpression() || parent.isFunction()) return; parent = parent.parentPath; }
      if (!parent || (parent.parentPath.isJSXAttribute() && !attrs.has(parent.parentPath.node.name.name))) return;
      const parts = p.node.quasis.map(part => part.value.cooked);
      const key = parts.map((part,index) => part + (index < parts.length - 1 ? '{' + index + '}' : '')).join('');
      values.add(key); templates = true; changed = true;
      p.replaceWith(types.callExpression(types.identifier('trTemplate'),[types.arrayExpression(parts.map(part => types.stringLiteral(part))),types.arrayExpression(p.node.expressions)])); p.skip();
    },
    JSXText(p) {
      const value = p.node.value.replace(/\s+/g,' ').trim();
      if (!value || !/[a-zA-Z]/.test(value)) return;
      p.replaceWith(types.jsxExpressionContainer(wrap(value)));
    },
    JSXAttribute(p) {
      if (attrs.has(p.node.name.name) && types.isStringLiteral(p.node.value) && /[a-zA-Z]/.test(p.node.value.value)) p.node.value = types.jsxExpressionContainer(wrap(p.node.value.value));
    },
    StringLiteral(p) {
      if (p.parentPath.isBinaryExpression()) return;
      if (p.parentPath.isCallExpression() && p.parent.callee.name === 'tr') return;
      if (!/[a-zA-Z]/.test(p.node.value)) return;
      let parent = p.parentPath;
      while (parent && !parent.isJSXExpressionContainer()) {
        if (parent.isCallExpression() || parent.isFunction() || parent.isJSXAttribute() || parent.isObjectProperty() || parent.isArrayExpression()) return;
        parent = parent.parentPath;
      }
      if (!parent) return;
      if (parent.parentPath.isJSXAttribute() && !attrs.has(parent.parentPath.node.name.name)) return;
      p.replaceWith(wrap(p.node.value)); p.skip();
    },
  });
  if (process.argv.includes('--spacing')) traverse(ast, {
    JSXElement(p) {
      const result = [];
      const translated = node => types.isJSXExpressionContainer(node) && types.isCallExpression(node.expression) && ['tr','trTemplate'].includes(node.expression.callee.name);
      for (const child of p.node.children) {
        const previous = result[result.length - 1];
        if (types.isJSXExpressionContainer(previous) && types.isJSXExpressionContainer(child) && (translated(previous) || translated(child))) { result.push(types.jsxText(' ')); changed = true; }
        result.push(child);
      }
      p.node.children = result;
    },
  });
  if (process.argv.includes('--write') && changed) {
    const relative = path.relative(path.dirname(file),path.join(root,'i18n','translations')).replaceAll('\\','/');
    const specifier = relative.startsWith('.') ? relative : './' + relative;
    if (!existing) ast.program.body.unshift(types.importDeclaration([types.importSpecifier(types.identifier('tr'),types.identifier('tr'))], types.stringLiteral(specifier)));
    const translationImport = existing || ast.program.body[0];
    if (templates && !translationImport.specifiers.some(item => item.local.name === 'trTemplate')) translationImport.specifiers.push(types.importSpecifier(types.identifier('trTemplate'),types.identifier('trTemplate')));
    fs.writeFileSync(file,generate(ast,{retainLines:false}).code + '\n');
  }
}
console.log(JSON.stringify([...values].filter(value => !process.argv.includes('--missing') || !Object.hasOwn(filipino,value)).sort(), null, 2));

