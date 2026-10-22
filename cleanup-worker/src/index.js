export default {
  async scheduled(event,env,ctx){
    const now=Date.now();let deleted=0;
    // Remove R2 object BEFORE database row. If delete fails the record is retried tomorrow.
    for(let page=0;page<40;page++){
      const records=await env.DB.prepare('SELECT id,storage_key FROM uploads WHERE expires_at<=? ORDER BY expires_at LIMIT 100').bind(now).all();
      if(!records.results?.length)break;
      const before=deleted;
      for(const file of records.results){
        try{await env.FILES.delete(file.storage_key);await env.DB.prepare('DELETE FROM uploads WHERE id=?').bind(file.id).run();deleted++;}
        catch(err){console.error('Cleanup error for object',file.id,String(err));}
      }
      if(records.results.length<100 || deleted===before)break;
    }
    await env.DB.prepare('DELETE FROM contacts_rate WHERE created_at<?').bind(now-3*86400000).run();
    console.log('QR Studio expiry cleanup deleted',deleted,'objects');
  }
};
