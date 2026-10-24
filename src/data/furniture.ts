import {furnitureCatalog,type Book,type FurnitureId,type FurniturePlacement} from './storage'
export const emptyFurniture=()=>({owned:[],layout:[]})
export function furnitureSpent(book:Book){return (book.furniture?.owned??[]).reduce((n,p)=>n+p.cost,0)}
export function furnitureBalance(book:Book,baseCoins:number){return baseCoins+book.entries.reduce((n,e)=>n+(e.rewardCoins??0),0)-furnitureSpent(book)}
export function positionItem(id:FurnitureId,x=575,y=350):FurniturePlacement{return {id,x:Math.max(45,Math.min(675,Math.round(x))),y:Math.max(120,Math.min(365,Math.round(y)))}}
export function buyFurniture(book:Book,id:FurnitureId,baseCoins:number,position: FurniturePlacement=positionItem(id)){
 const item=furnitureCatalog.find(i=>i.id===id),state=book.furniture??emptyFurniture()
 if(!item||item.payment!=='coins')throw new Error('付費物品需經商店驗證後才能解鎖，目前可先試擺。')
 if(state.owned.some(p=>p.id===id))throw new Error('這件物品已收藏，不會重複扣款。')
 if(!Number.isFinite(baseCoins)||baseCoins<0||furnitureBalance(book,baseCoins)<item.price)throw new Error('金幣不足，先累積日常簽到與不買獎勵吧。')
 const placed=positionItem(id,position.x,position.y)
 if(!Number.isFinite(placed.x)||!Number.isFinite(placed.y))throw new Error('擺放位置不正確。')
 return {...book,furniture:{owned:[...state.owned,{id,cost:item.price}],layout:[...state.layout,placed]}}
}
export function placeFurniture(book:Book,placement:FurniturePlacement){
 const state=book.furniture??emptyFurniture()
 if(!state.owned.some(p=>p.id===placement.id))throw new Error('請先收藏這件物品，再儲存擺放位置。')
 const next=positionItem(placement.id,placement.x,placement.y)
 if(!Number.isFinite(next.x)||!Number.isFinite(next.y))throw new Error('擺放位置不正確。')
 return {...book,furniture:{...state,layout:[...state.layout.filter(p=>p.id!==placement.id),next]}}
}
export function storeFurniture(book:Book,id:FurnitureId){const state=book.furniture??emptyFurniture();return {...book,furniture:{...state,layout:state.layout.filter(p=>p.id!==id)}}}
