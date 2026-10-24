import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {join} from 'node:path'
const pkg=JSON.parse(readFileSync('package.json','utf8'))
const seen=new Set(),notices=['Little Daily — third-party notices\nGenerated from installed production dependencies.\n']
function visit(name){if(seen.has(name))return;seen.add(name);const root=join('node_modules',name),p=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));const license=['LICENSE','LICENSE.md','LICENSE.txt','LICENSE-MIT','license','license.md','license.txt'].map(f=>join(root,f)).find(existsSync);if(!license)throw new Error('需要確認授權檔：'+name);notices.push(`\n========== ${name} ${p.version} (${p.license??'see license'}) ==========\n`+readFileSync(license,'utf8'));for(const child of Object.keys(p.dependencies??{}))visit(child)}
for(const name of Object.keys(pkg.dependencies))visit(name)
notices.push('\n========== Huninn font =========='+'\n'+readFileSync('public/huninn-LICENSE.txt','utf8'))
notices.push('\n========== Iansui font =========='+'\n'+readFileSync('public/iansui-LICENSE.txt','utf8'))
writeFileSync('public/third-party-notices.txt',notices.join('\n'))
console.log('已整理 '+seen.size+' 個正式依賴及字型的授權聲明。')
