package id.portfolio.search.documents;

import id.portfolio.search.api.Problem;
import id.portfolio.search.auth.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.*;
import java.security.*;

@Service
public class DocumentService {
    public static final String ACL=" d.workspace_id=? AND (d.visibility='workspace' OR d.owner_id=?) ";
    private final JdbcTemplate db;
    private final TransactionTemplate tx;
    private final Extractor extractor;
    private final AuthService auth;
    public DocumentService(JdbcTemplate db,TransactionTemplate tx,Extractor extractor,AuthService auth) { this.db=db; this.tx=tx; this.extractor=extractor; this.auth=auth; }
    public List<Map<String,Object>> list(Actor a) {
        return db.queryForList("SELECT d.*,u.name owner_name,v.filename,v.text_length,(SELECT count(*) FROM chunks WHERE version_id=v.id) chunks FROM documents d JOIN users u ON u.id=d.owner_id JOIN versions v ON v.document_id=d.id AND v.number=d.current_version WHERE "+ACL+" ORDER BY d.updated_at DESC LIMIT 500",a.workspaceId(),a.id());
    }
    public Map<String,Object> document(Actor a,UUID id) {
        var rows=db.queryForList("SELECT d.*,u.name owner_name FROM documents d JOIN users u ON u.id=d.owner_id WHERE d.id=? AND "+ACL,id,a.workspaceId(),a.id());
        if(rows.isEmpty()) throw Problem.missing(); return rows.getFirst();
    }
    private void owned(Actor a,UUID id) {
        var doc=document(a,id);
        if(!a.id().equals(doc.get("owner_id"))) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN,"Hanya pemilik yang dapat mengubah dokumen.");
    }
    public Map<String,Object> detail(Actor a,UUID id,Integer number) {
        var doc=new HashMap<>(document(a,id));
        int version=number==null?((Number)doc.get("current_version")).intValue():number;
        var versions=db.queryForList("SELECT id,number,filename,media_type,checksum,text_length,created_at FROM versions WHERE document_id=? ORDER BY number DESC",id);
        var selected=versions.stream().filter(v->((Number)v.get("number")).intValue()==version).findFirst().orElseThrow(Problem::missing);
        doc.put("versions",versions); doc.put("selectedVersion",version);
        doc.put("chunks",db.queryForList("SELECT id,ordinal,location,content FROM chunks WHERE version_id=? ORDER BY ordinal",selected.get("id")));
        return doc;
    }
    public record Download(byte[] bytes,String filename,String mediaType) {}
    public Download download(Actor a,UUID id,int number) {
        document(a,id);
        var rows=db.query("SELECT file_bytes,filename,media_type FROM versions WHERE document_id=? AND number=?",(r,n)->new Download(r.getBytes(1),r.getString(2),r.getString(3)),id,number);
        if(rows.isEmpty()) throw Problem.missing(); return rows.getFirst();
    }
    public static String clean(String value,int max,String label) {
        if(value==null || value.isBlank() || value.length()>max || value.chars().anyMatch(c->c<32)) throw Problem.bad(label+" tidak valid."); return value.trim();
    }
    public static void visibility(String value) { if(!Set.of("private","workspace").contains(value)) throw Problem.bad("Hak akses tidak valid."); }
    public static String source(String value) {
        if(value==null || value.isBlank()) return "";
        if(value.length()>1000) throw Problem.bad("URL terlalu panjang.");
        try { var uri=java.net.URI.create(value); if(!Set.of("http","https").contains(uri.getScheme()) || uri.getHost()==null || uri.getUserInfo()!=null) throw new IllegalArgumentException(); }
        catch(Exception e) { throw Problem.bad("Sumber harus berupa URL HTTP atau HTTPS yang valid."); }
        return value;
    }
    public Map<String,Object> upload(Actor a,UUID existing,String title,String visibility,String category,String source,String license,String filename,byte[] bytes) {
        title=clean(title,200,"Judul"); category=clean(category,80,"Kategori"); visibility(visibility); source=source(source);
        license=license==null?"":license.trim(); if(license.length()>200) throw Problem.bad("Lisensi terlalu panjang.");
        filename=clean(filename,200,"Nama file").replaceAll("[\\\\/]","_");
        int dot=filename.lastIndexOf('.'); String extension=dot<0?"":filename.substring(dot).toLowerCase(Locale.ROOT);
        String mediaType=switch(extension) { case ".pdf"->"application/pdf"; case ".docx"->"application/vnd.openxmlformats-officedocument.wordprocessingml.document"; case ".txt", ".md"->"text/plain"; default->throw Problem.bad("Format belum didukung."); };
        if(bytes.length==0 || bytes.length>12*1024*1024) throw Problem.bad("File harus berisi data dan maksimal 12 MB.");
        if(existing!=null) owned(a,existing);
        UUID run=UUID.randomUUID();
        db.update("INSERT INTO indexing_runs(id,workspace_id,user_id,document_id,filename,status) VALUES (?,?,?,?,?,'processing')",run,a.workspaceId(),a.id(),existing,filename);
        try {
            String checksum=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
            var extracted=extractor.extract(bytes,extension);
            final String fTitle=title,fVisibility=visibility,fCategory=category,fSource=source,fLicense=license,fFilename=filename;
            return tx.execute(s->{
                UUID id=existing==null?UUID.randomUUID():existing;
                int version=1;
                if(existing==null) {
                    db.update("INSERT INTO documents(id,workspace_id,owner_id,title,visibility,category,source_url,license) VALUES (?,?,?,?,?,?,?,?)",id,a.workspaceId(),a.id(),fTitle,fVisibility,fCategory,fSource,fLicense);
                } else {
                    var locked=db.queryForList("SELECT current_version FROM documents WHERE id=? AND workspace_id=? AND owner_id=? FOR UPDATE",id,a.workspaceId(),a.id());
                    if(locked.isEmpty()) throw Problem.missing();
                    version=((Number)locked.getFirst().get("current_version")).intValue()+1;
                    String previous=db.queryForObject("SELECT checksum FROM versions WHERE document_id=? AND number=?",String.class,id,version-1);
                    if(checksum.equals(previous)) {
                        db.update("UPDATE indexing_runs SET status='unchanged',message='Isi identik dengan versi aktif.',finished_at=now() WHERE id=?",run);
                        return Map.<String,Object>of("id",id,"status","unchanged","version",version-1);
                    }
                }
                UUID versionId=UUID.randomUUID();
                db.update("INSERT INTO versions(id,document_id,number,filename,media_type,checksum,file_bytes,text_length) VALUES (?,?,?,?,?,?,?,?)",versionId,id,version,fFilename,mediaType,checksum,bytes,extracted.textLength());
                int ordinal=0;
                for(var chunk:extracted.chunks()) db.update("INSERT INTO chunks(id,version_id,ordinal,location,content) VALUES (?,?,?,?,?)",UUID.randomUUID(),versionId,++ordinal,chunk.location(),chunk.content());
                db.update("UPDATE documents SET current_version=?,title=?,visibility=?,category=?,source_url=?,license=?,updated_at=now() WHERE id=?",version,fTitle,fVisibility,fCategory,fSource,fLicense,id);
                db.update("UPDATE indexing_runs SET document_id=?,status='success',message='Ekstraksi dan index tersimpan.',chunks=?,finished_at=now() WHERE id=?",id,ordinal,run);
                auth.audit(a,"document.index",id+":v"+version);
                return Map.<String,Object>of("id",id,"status","success","version",version,"chunks",ordinal);
            });
        } catch(Exception ex) {
            String message=ex instanceof org.springframework.web.server.ResponseStatusException r?r.getReason():"Pengindeksan gagal. Versi aktif sebelumnya tetap tersedia.";
            db.update("UPDATE indexing_runs SET status='failed',message=?,finished_at=now() WHERE id=?",message,run);
            if(ex instanceof RuntimeException r) throw r; throw new IllegalStateException(ex);
        }
    }
    public void update(Actor a,UUID id,String title,String visibility,String category) {
        owned(a,id); title=clean(title,200,"Judul"); category=clean(category,80,"Kategori"); visibility(visibility);
        final String t=title,c=category;
        tx.executeWithoutResult(s->{ db.update("UPDATE documents SET title=?,visibility=?,category=?,updated_at=now() WHERE id=? AND owner_id=?",t,visibility,c,id,a.id()); auth.audit(a,"document.access",id+":"+visibility); });
    }
    public void delete(Actor a,UUID id) { owned(a,id); tx.executeWithoutResult(s->{ db.update("DELETE FROM documents WHERE id=? AND owner_id=?",id,a.id()); auth.audit(a,"document.delete",id.toString()); }); }
    public Object runs(Actor a) { return db.queryForList("SELECT r.* FROM indexing_runs r WHERE r.workspace_id=? AND r.user_id=? ORDER BY started_at DESC LIMIT 100",a.workspaceId(),a.id()); }
    public Object audit(Actor a) { auth.admin(a); return db.queryForList("SELECT e.*,u.name actor_name FROM audit_events e JOIN users u ON u.id=e.user_id WHERE e.workspace_id=? ORDER BY e.id DESC LIMIT 100",a.workspaceId()); }
    public Object stats(Actor a) {
        var result=new HashMap<String,Object>();
        result.put("documents",db.queryForObject("SELECT count(*) FROM documents d WHERE "+ACL,Long.class,a.workspaceId(),a.id()));
        result.put("chunks",db.queryForObject("SELECT count(*) FROM chunks c JOIN versions v ON v.id=c.version_id JOIN documents d ON d.id=v.document_id AND d.current_version=v.number WHERE "+ACL,Long.class,a.workspaceId(),a.id()));
        result.put("categories",db.queryForList("SELECT category,count(*) count FROM documents d WHERE "+ACL+" GROUP BY category ORDER BY category",a.workspaceId(),a.id()));
        return result;
    }
}
