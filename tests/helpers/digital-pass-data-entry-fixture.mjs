/** Local emulator fixture only. Never use with a real project. */
export function syntheticDataEntryMatrix() {
 const seasonId='2026-27', orgIds=['synthetic-org-a','synthetic-org-b'];
 return {seasonId,startNumber:1,
  form:{seasonId,category:'ticket',catalogItemIds:['synthetic-season'],organizationIds:orgIds},
  items:[{id:'synthetic-season',category:'ticket',code:'sk-dns',displayOrder:1}],
  organizations:orgIds.map(id=>({id,active:true})),
  orders:orgIds.map(organizationId=>({id:seasonId+'__ticket__'+organizationId,seasonId,category:'ticket',organizationId,status:'draft'})),
  lines:orgIds.map((organizationId,i)=>({id:seasonId+'__ticket__'+organizationId+'__synthetic-season',
   seasonId,organizationId,ticketOrderId:seasonId+'__ticket__'+organizationId,catalogItemId:'synthetic-season',quantity:i===0?20:10})),
 };
}
