import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
const code=ts.transpileModule(readFileSync(new URL('../src/data/onboarding.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const {onboardingKey,shouldShowTour,rememberTour,tourCardPosition,tourSteps}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

test('首次導覽顯示，完成或跳過後不再自動顯示，不更動工具紀錄',()=>{
  const values=new Map([['little-daily-tool-tasks-v1','existing-data']])
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}
  assert.equal(shouldShowTour(storage),true)
  rememberTour(storage)
  assert.equal(shouldShowTour(storage),false)
  assert.equal(values.get('little-daily-tool-tasks-v1'),'existing-data')
  assert.equal(values.get(onboardingKey),'seen')
})

test('儲存被封鎖時不自動反覆開啟，寫入錯誤交由介面提示',()=>{
  assert.equal(shouldShowTour({getItem(){throw new Error('SecurityError')}}),false)
  assert.throws(()=>rememberTour({setItem(){throw new Error('QuotaExceededError')}}))
})

test('提示卡在桌面、手機與橫向視窗內保持可見',()=>{
  for(const viewport of [{width:1280,height:720},{width:375,height:667},{width:667,height:375}]){
    const card={width:Math.min(400,viewport.width-32),height:Math.min(400,viewport.height-32)}
    for(const target of [null,{left:16,top:16,width:viewport.width-32,height:100},{left:16,top:viewport.height-120,width:viewport.width-32,height:100},{left:16,top:16,width:viewport.width-32,height:viewport.height-32}]){
      const pos=tourCardPosition(viewport,card,target)
      assert.ok(pos.left>=16 && pos.top>=16)
      assert.ok(pos.left+card.width<=viewport.width-16)
      assert.ok(pos.top+card.height<=viewport.height-16)
    }
  }
})

test('下方不夠空間時移到目標上方，隱藏工具可用置中提示',()=>{
  const viewport={width:1280,height:720},card={width:400,height:300}
  const target={left:200,top:500,width:400,height:100}
  const pos=tourCardPosition(viewport,card,target)
  assert.ok(pos.top+card.height<target.top)
  assert.deepEqual(tourCardPosition(viewport,card,null),{left:440,top:210})
  assert.equal(tourSteps.length,6)
  assert.equal(tourSteps[0].target,null)
})
