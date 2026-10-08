package id.portfolio.search.retrieval;

import id.portfolio.search.api.Problem;
import id.portfolio.search.auth.Actor;
import id.portfolio.search.documents.DocumentService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class SearchService {
    private final JdbcTemplate db;
    private final SemanticRanker semantic;
    private static final int CANDIDATE_LIMIT=100;
    private static final Pattern WORD=Pattern.compile("[\\p{L}\\p{N}]{2,}");
    private static final Set<String> STOP=Set.of("apa","yang","dan","di","ke","dari","untuk","adalah","bagaimana","the","a","an","is","of","to","in","and","what","how","does","itu","pada","dengan","saya","tolong","berapa","kapan","siapa","bulan","are","used","for");
    public record Hit(UUID chunkId,UUID documentId,int version,String title,String category,String visibility,String owner,String location,String content,double score,String sourceUrl,String license,List<String> highlights,String matchType) {
        public Hit reranked(double relevance,List<String> terms) { return new Hit(chunkId,documentId,version,title,category,visibility,owner,location,content,relevance,sourceUrl,license,terms,"semantic"); }
    }
    public record Results(List<Hit> items,int total,long elapsedMs,String method,String query,String retrieval,String notice,int examined,int available) {}
    public SearchService(JdbcTemplate db,SemanticRanker semantic) { this.db=db; this.semantic=semantic; }
    public static List<String> tokens(String query) {
        if(query==null || query.isBlank() || query.length()>500) throw Problem.bad("Masukkan pencarian antara 1 dan 500 karakter.");
        var words=new LinkedHashSet<String>(); var matcher=WORD.matcher(query.toLowerCase(Locale.ROOT));
        while(matcher.find()) if(!STOP.contains(matcher.group())) words.add(matcher.group());
        if(words.isEmpty()) throw Problem.bad("Gunakan kata kunci yang lebih spesifik.");
        if(words.size()>24) throw Problem.bad("Maksimal 24 kata kunci per pencarian.");
        return List.copyOf(words);
    }
    public Results search(Actor a,String query,String method,String category,String visibility,int page,int size) {
        long start=System.nanoTime();
        if(!Set.of("hybrid","ranked","boolean").contains(method) || page<0 || page>100 || size<1 || size>50) throw Problem.bad("Parameter pencarian tidak valid.");
        var terms=tokens(query);
        if(!method.equals("hybrid")) return lexical(a,query,method,category,visibility,page,size,terms,start,"");
        if(!semantic.configured()) return lexical(a,query,"ranked",category,visibility,page,size,terms,start,"AI belum dikonfigurasi. Hasil menggunakan kata kunci saja.");
        String from=" FROM chunks c JOIN versions v ON v.id=c.version_id JOIN documents d ON d.id=v.document_id AND d.current_version=v.number JOIN users u ON u.id=d.owner_id CROSS JOIN to_tsquery('simple',?) q(term) WHERE "+DocumentService.ACL;
        var params=new ArrayList<Object>(List.of(String.join(" | ",terms),a.workspaceId(),a.id()));
        from=filters(from,params,category,visibility);
        int available=db.queryForObject("SELECT count(*)"+from,Integer.class,params.toArray());
        if(available==0) return new Results(List.of(),0,ms(start),method,query,"semantic","",0,0);
        String score="ts_rank_cd(c.search_vector,q.term)+2*ts_rank_cd(to_tsvector('simple',d.title),q.term)";
        params.add(CANDIDATE_LIMIT);
        var candidates=db.query(select(score)+from+" ORDER BY score DESC,d.updated_at DESC,c.ordinal,c.id LIMIT ?",(r,n)->hit(r,terms,"keyword"),params.toArray());
        try {
            var matches=semantic.rank(query,candidates);
            List<Hit> ranked=new ArrayList<>();
            for(var match:matches) {
                var h=candidates.get(match.index());
                // Akses diperiksa ulang setelah menunggu model.
                if(stillAllowed(a,h)) {
                    var highlights=new LinkedHashSet<>(match.highlights()); highlights.addAll(terms);
                    ranked.add(h.reranked(match.score(),List.copyOf(highlights)));
                }
            }
            // Pencabutan sesi juga diperiksa sebelum hasil dikembalikan.
            boolean active=db.queryForObject("SELECT active FROM users WHERE id=?",Boolean.class,a.id());
            if(!active) return new Results(List.of(),0,ms(start),method,query,"semantic","Akun telah dinonaktifkan.",candidates.size(),available);
            String notice=available>CANDIDATE_LIMIT?"Pencarian makna menilai 100 kandidat dari "+available+" potongan. Persempit kategori atau kata kunci untuk corpus besar.":"";
            int offset=Math.min(page*size,ranked.size()),end=Math.min(offset+size,ranked.size());
            return new Results(List.copyOf(ranked.subList(offset,end)),ranked.size(),ms(start),method,query,"semantic",notice,candidates.size(),available);
        } catch(Exception ex) {
            org.slf4j.LoggerFactory.getLogger(SearchService.class).warn("Semantic ranking gagal: {}",ex.getClass().getSimpleName());
            return lexical(a,query,"ranked",category,visibility,page,size,terms,start,"Pencarian makna tidak tersedia. Hasil berikut hanya menggunakan kata kunci.");
        }
    }
    private Results lexical(Actor a,String query,String method,String category,String visibility,int page,int size,List<String> terms,long start,String notice) {
        String term=String.join(method.equals("boolean")?" & ":" | ",terms);
        String score=method.equals("boolean")?"ts_rank_cd(c.search_vector,q.term)":"ts_rank_cd(c.search_vector,q.term)+2*ts_rank_cd(to_tsvector('simple',d.title),q.term)";
        String from=" FROM chunks c JOIN versions v ON v.id=c.version_id JOIN documents d ON d.id=v.document_id AND d.current_version=v.number JOIN users u ON u.id=d.owner_id CROSS JOIN to_tsquery('simple',?) q(term) WHERE "+DocumentService.ACL+" AND (c.search_vector @@ q.term OR to_tsvector('simple',d.title) @@ q.term)";
        var params=new ArrayList<Object>(List.of(term,a.workspaceId(),a.id()));
        from=filters(from,params,category,visibility);
        int total=db.queryForObject("SELECT count(*)"+from,Integer.class,params.toArray());
        params.add(size); params.add(page*size);
        var items=db.query(select(score)+from+" ORDER BY score DESC,d.updated_at DESC,c.ordinal,c.id LIMIT ? OFFSET ?",(r,n)->hit(r,terms,"keyword"),params.toArray());
        return new Results(items,total,ms(start),method,query,"keyword",notice,total,total);
    }
    private String filters(String from,List<Object> params,String category,String visibility) {
        if(category!=null && !category.isBlank()) { from+=" AND d.category=?"; params.add(category); }
        if(visibility!=null && !visibility.isBlank()) { DocumentService.visibility(visibility); from+=" AND d.visibility=?"; params.add(visibility); }
        return from;
    }
    private String select(String score) { return "SELECT c.id chunk_id,d.id document_id,v.number,d.title,d.category,d.visibility,u.name owner,c.location,c.content,d.source_url,d.license,"+score+" score"; }
    private Hit hit(java.sql.ResultSet r,List<String> terms,String type) throws java.sql.SQLException {
        return new Hit(r.getObject("chunk_id",UUID.class),r.getObject("document_id",UUID.class),r.getInt("number"),r.getString("title"),r.getString("category"),r.getString("visibility"),r.getString("owner"),r.getString("location"),r.getString("content"),r.getDouble("score"),r.getString("source_url"),r.getString("license"),terms,type);
    }
    private long ms(long start) { return (System.nanoTime()-start)/1_000_000; }
    public Results evidence(Actor a,String query,String category,String visibility) { return search(a,query,"hybrid",category,visibility,0,40); }
    public boolean stillAllowed(Actor a,Hit hit) {
        return db.queryForObject("SELECT count(*) FROM documents d JOIN users actor ON actor.id=? AND actor.active WHERE d.id=? AND d.current_version=? AND "+DocumentService.ACL,Integer.class,a.id(),hit.documentId(),hit.version(),a.workspaceId(),a.id())>0;
    }
}
