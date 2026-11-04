/** Serialized staged transaction double; no credentials, sockets or production data. */
export class MemoryDb {
  values=new Map(); tail=Promise.resolve();
  snapshot(key) {return {exists:this.values.has(key),data:()=>structuredClone(this.values.get(key))};}
  collection(name) {
    const query=(field,value)=>({limit:()=>query(field,value),get:async()=>{
      const docs=[...this.values].filter(([key,v])=>key.startsWith(name+'/')&&v[field]===value).map(([key])=>this.snapshot(key));
      return {docs,empty:docs.length===0};
    }});
    return {doc:id=>({key:name+'/'+id,get:async()=>this.snapshot(name+'/'+id)}),where:(field,_op,value)=>query(field,value)};
  }
  runTransaction(fn) {
    const run=this.tail.then(async()=>{
      const staged=[];let written=false;
      const result=await fn({get:async r=>{if(written)throw Error('READ_AFTER_WRITE');return this.snapshot(r.key)},
        create:(r,v)=>{written=true;staged.push(['create',r.key,v])},
        set:(r,v)=>{written=true;staged.push(['set',r.key,v])},update:(r,v)=>{written=true;staged.push(['update',r.key,v])}});
      const next=new Map(this.values);
      for(const [op,key,value] of staged){
        if(op==='create'&&next.has(key))throw Error('ALREADY_EXISTS');
        if(op==='update'&&!next.has(key))throw Error('NOT_FOUND');
        next.set(key,structuredClone(op==='update'?{...next.get(key),...value}:value));
      }
      this.values=next;return result;
    });this.tail=run.catch(()=>{});return run;
  }
}
