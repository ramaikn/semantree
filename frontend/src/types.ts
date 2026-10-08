export type User={id:string;workspaceId:string;name:string;email:string;role:string;workspace:string}
export type Doc={id:string;title:string;category:string;visibility:string;owner_id:string;owner_name:string;source_url:string;license:string;current_version:number;updated_at:string;chunks:number;filename:string;text_length:number}
export type Chunk={id:string;ordinal:number;location:string;content:string}
export type Version={id:string;number:number;filename:string;checksum:string;text_length:number;created_at:string}
export type Detail=Doc & {versions:Version[];selectedVersion:number;chunks:Chunk[]}
export type Hit={chunkId:string;documentId:string;version:number;title:string;category:string;visibility:string;owner:string;location:string;content:string;score:number;sourceUrl:string;license:string;highlights:string[];matchType:string}
export type Results={items:Hit[];total:number;elapsedMs:number;method:string;query:string;retrieval:string;notice:string;examined:number;available:number}
export type Answer={status:string;claims:{text:string;citations:string[]}[];citations:{id:string;source:Hit}[];message:string;model:string;elapsedMs:number;relevantDocuments:Hit[];retrieval:string;retrievalNotice:string}
export type Stats={documents:number;chunks:number;categories:{category:string;count:number}[]}
export const date=(value:string)=>new Date(value).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})
