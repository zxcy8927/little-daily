import {readFileSync,existsSync,readdirSync} from 'node:fs'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
const read=p=>readFileSync(p,'utf8').replace(/^\uFEFF/,'')
const required=['capacitor.config.ts','android/app/src/main/AndroidManifest.xml','android/app/src/main/res/drawable/ic_stat_daily.xml','ios/App/App/PrivacyInfo.xcprivacy','ios/App/App.xcodeproj/project.pbxproj']
for(const p of required)if(!existsSync(p))throw new Error('缺少手機專案檔案：'+p)
const config=read('capacitor.config.ts')
if(/server\s*:/.test(config))throw new Error('原生設定不得指向開發伺服器')
if(!read('android/app/src/main/AndroidManifest.xml').includes('android.permission.SCHEDULE_EXACT_ALARM" tools:node="remove"'))throw new Error('不應要求精準鬧鐘特殊權限')
if(!read('android/app/src/main/AndroidManifest.xml').includes('android:allowBackup="false"'))throw new Error('Android 備份設定與隱私說明不一致')
const xcode=read('ios/App/App.xcodeproj/project.pbxproj')
if((xcode.match(/PrivacyInfo.xcprivacy in Resources/g)??[]).length<2)throw new Error('iOS 隱私資源未加入編譯目標')
if(!read('ios/App/App/PrivacyInfo.xcprivacy').includes('C617.1'))throw new Error('缺少檔案 API 隱私理由')
function files(root,prefix=''){return readdirSync(root,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(root,e.name),prefix+e.name+'/'):[prefix+e.name])}
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
for(const path of files('dist'))for(const root of ['android/app/src/main/assets/public','ios/App/App/public'])if(!existsSync(join(root,path))||hash(join(root,path))!==hash(join('dist',path)))throw new Error('手機資源未同步：'+join(root,path)+'；請執行 npm run mobile:sync')
console.log('手機專案靜態檢查通過：Android／iOS 原始專案、隱私資源、通知圖示與網頁資源一致。這不是 APK／IPA 編譯或實機驗證。')
const java=spawnSync('java',['-version'],{encoding:'utf8',windowsHide:true})
console.log(java.error?'尚未偵測到 Java，Android 原生編譯仍待建置環境。':'已偵測 Java；仍須在 Android Studio 確認 SDK。')
if(process.argv.includes('--release')){
 const profile=JSON.parse(read('docs/store-profile.json')),missing=[]
 for(const field of ['operatorName','supportEmail','privacyUrl','supportUrl','productionAppId','pricingDecision'])if(!profile[field])missing.push(field)
 for(const field of ['androidDeviceTested','iosDeviceTested','privacyReviewed','storeAssetsApproved'])if(profile[field]!==true)missing.push(field)
 if(profile.privacyUrl&&!/^https:\/\//.test(profile.privacyUrl))missing.push('privacyUrl 需為 HTTPS')
 if(profile.supportUrl&&!/^https:\/\//.test(profile.supportUrl))missing.push('supportUrl 需為 HTTPS')
 if(profile.supportEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.supportEmail))missing.push('客服信箱格式')
 if(profile.productionAppId&&(!config.includes(profile.productionAppId)||!read('android/app/build.gradle').includes(profile.productionAppId)||!xcode.includes(profile.productionAppId)))missing.push('正式識別碼尚未在三處對齊')
 if(config.includes('app.littledaily.preview'))missing.push('測試識別碼尚未換為正式值')
 if(missing.length){console.error('尚未達到送審條件：'+missing.join('、'));process.exitCode=1}else{console.log('資料表已填寫；仍需由商店後台驗證簽章、購買流程及審查申報。')}
}
