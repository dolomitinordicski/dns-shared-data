/** Whitelisted historical questionnaire fields: never certify imported answers. */
export const PARTNER_IMPORT_COLUMNS = [
  4,5,6,7,8,9,10,11,12,16,17,19,21,23,24,25,27,28,29,30,31,
] as const;

export const PARTNER_IMPORT_FIELD_NAMES: Readonly<Record<number,string>> = {
  4:'identity.name',5:'identity.address',6:'contact.phone',7:'contact.businessEmail',
  8:'identity.website',9:'location.legacyArea',10:'location.tourismAssociation',
  11:'trail.nearby',12:'trail.access',16:'services.skiroom',
  17:'services.skiroomEquipment',19:'services.drying',21:'services.information',
  23:'services.ticketSale',24:'services.ticketTypes',25:'services.ticketChannels',
  27:'services.packages',28:'services.packageUrl',
  29:'services.cooperations',30:'services.cooperationDetails',
  31:'digital.crossCountryPage',
};
export interface ImportedCandidateField { column:number; field:string; value:string; verification:'pending'; }
export interface LegacyImportCandidate {
  sourceId:string;
  sourceTimestamp:string|null;
  establishmentId:null;
  status:'unmatched';
  fields:readonly ImportedCandidateField[];
}
export function selectPartnerImportValues(row: readonly unknown[]): ImportedCandidateField[] {
  return PARTNER_IMPORT_COLUMNS.flatMap(column=>{
    const raw=row[column-1];
    if(raw===null || raw===undefined || String(raw).trim()==='')return [];
    return [{column,field:PARTNER_IMPORT_FIELD_NAMES[column],value:String(raw).trim(),verification:'pending' as const}];
  });
}
/** Pure staging candidate only. Never auto-grants access or infers accreditation. */
export function stageLegacyPartnerResponse(row:readonly unknown[],sourceId:string):LegacyImportCandidate {
  if(!sourceId.trim())throw new Error('Source row ID required');
  return {
    sourceId,
    sourceTimestamp:row[0] == null ? null : String(row[0]),
    establishmentId:null,
    status:'unmatched',
    fields:selectPartnerImportValues(row),
  };
}
