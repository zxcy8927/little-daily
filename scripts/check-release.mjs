import {readFileSync,existsSync,readdirSync} from 'node:fs'
import {resolve,join} from 'node:path'
const root=resolve('dist'),sw=readFileSync(join(root,'sw.js'),'utf8')
const match=sw.match(/const ASSETS=(\[.*\]);/)
if(!match)throw new Error('離線資源清單不存在')
const assets=JSON.parse(match[1]);const paths=new Set(assets)
for(const path of assets){const relative=path==='./' ? 'index.html' : path.replace(/^\.\//,'');if(!existsSync(join(root,relative)))throw new Error('離線檔案缺少：'+path)}
for(const name of readdirSync(join(root,'assets')))if(!paths.has('./assets/'+name))throw new Error('程式資源未列入離線快取：'+name)
const manifest=JSON.parse(readFileSync(join(root,'manifest.webmanifest'),'utf8').replace(/^\uFEFF/,''))
for(const icon of manifest.icons){const data=readFileSync(join(root,icon.src));if(data.readUInt32BE(16)!==Number(icon.sizes.split('x')[0]))throw new Error('圖示尺寸不符')}
console.log('正式版資源檢查通過：離線程式、字體、隱私／客服說明與安裝圖示均存在。')
