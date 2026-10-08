package id.portfolio.search.evaluation;

import id.portfolio.search.api.Problem;
import id.portfolio.search.auth.*;
import id.portfolio.search.documents.DocumentService;
import id.portfolio.search.retrieval.SearchService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class EvaluationService {
    private final JdbcTemplate db;
    private final AuthService auth;
    private final DocumentService docs;
    private final SearchService search;
    public record Judgment(String query,UUID documentId,int relevance,String split,String rationale) {}
    public EvaluationService(JdbcTemplate db,AuthService auth,DocumentService docs,SearchService search) { this.db=db;this.auth=auth;this.docs=docs;this.search=search; }
    public Object list(Actor a) {
        auth.admin(a);
        return db.queryForList("SELECT j.*,d.title FROM judgments j JOIN documents d ON d.id=j.document_id WHERE j.workspace_id=? AND "+DocumentService.ACL+" ORDER BY j.split,j.query",a.workspaceId(),a.workspaceId(),a.id());
    }
    public void save(Actor a,Judgment in) {
        auth.admin(a); SearchService.tokens(in.query()); docs.document(a,in.documentId());
        if(!Set.of("tuning","holdout").contains(in.split()) || in.relevance()<1 || in.relevance()>3) throw Problem.bad("Label evaluasi tidak valid.");
        String reason=DocumentService.clean(in.rationale(),500,"Alasan relevansi");
        db.update("INSERT INTO judgments(id,workspace_id,query,document_id,relevance,split,rationale) VALUES (?,?,?,?,?,?,?) ON CONFLICT(workspace_id,query,document_id,split) DO UPDATE SET relevance=excluded.relevance,rationale=excluded.rationale",UUID.randomUUID(),a.workspaceId(),in.query().trim(),in.documentId(),in.relevance(),in.split(),reason);
        auth.audit(a,"evaluation.label",in.split());
    }
    public void delete(Actor a,UUID id) { auth.admin(a); db.update("DELETE FROM judgments WHERE id=? AND workspace_id=?",id,a.workspaceId()); }
    public static double ndcg(List<UUID> retrieved,Map<UUID,Integer> labels,int k) {
        double dcg=0,idcg=0;
        for(int i=0;i<Math.min(k,retrieved.size());i++) dcg+=(Math.pow(2,labels.getOrDefault(retrieved.get(i),0))-1)/(Math.log(i+2)/Math.log(2));
        var ideal=labels.values().stream().sorted(Comparator.reverseOrder()).limit(k).toList();
        for(int i=0;i<ideal.size();i++) idcg+=(Math.pow(2,ideal.get(i))-1)/(Math.log(i+2)/Math.log(2));
        return idcg==0?0:dcg/idcg;
    }
    public Object run(Actor a,String split,boolean hybrid) {
        auth.admin(a);
        if(!Set.of("tuning","holdout").contains(split)) throw Problem.bad("Split tidak valid.");
        var rows=db.queryForList("SELECT j.query,j.document_id,j.relevance FROM judgments j JOIN documents d ON d.id=j.document_id WHERE j.workspace_id=? AND j.split=? AND "+DocumentService.ACL,a.workspaceId(),split,a.workspaceId(),a.id());
        Map<String,Map<UUID,Integer>> queries=new LinkedHashMap<>();
        for(var row:rows) queries.computeIfAbsent((String)row.get("query"),q->new LinkedHashMap<>()).put((UUID)row.get("document_id"),((Number)row.get("relevance")).intValue());
        if(queries.isEmpty()) throw Problem.bad("Belum ada label relevansi yang dapat diakses untuk split ini.");
        if(queries.size()>100) throw Problem.bad("Maksimal 100 query per evaluasi lokal.");
        var comparison=new ArrayList<Map<String,Object>>();
        for(String method:hybrid?List.of("boolean","ranked","hybrid"):List.of("boolean","ranked")) {
            var details=new ArrayList<Map<String,Object>>(); double mrr=0,recall=0,ndcg=0; long elapsed=0;
            for(var entry:queries.entrySet()) {
                var result=search.search(a,entry.getKey(),method,null,null,0,50);
                var ids=result.items().stream().map(SearchService.Hit::documentId).distinct().limit(5).toList();
                double rr=0; int found=0;
                for(int i=0;i<ids.size();i++) if(entry.getValue().containsKey(ids.get(i))) { found++; if(rr==0) rr=1.0/(i+1); }
                double rec=(double)found/entry.getValue().size(), n=ndcg(ids,entry.getValue(),5);
                mrr+=rr; recall+=rec; ndcg+=n; elapsed+=result.elapsedMs();
                details.add(Map.of("query",entry.getKey(),"mrr",rr,"recallAt5",rec,"ndcgAt5",n,"retrieved",ids,"elapsedMs",result.elapsedMs(),"retrieval",result.retrieval(),"notice",result.notice()));
            }
            comparison.add(Map.of("method",method,"queries",queries.size(),"mrr",mrr/queries.size(),"recallAt5",recall/queries.size(),"ndcgAt5",ndcg/queries.size(),"meanLatencyMs",(double)elapsed/queries.size(),"details",details));
        }
        auth.audit(a,"evaluation.run",split+":"+queries.size());
        return Map.of("split",split,"k",5,"compared",comparison,"limitations","Label manusia, corpus simulasi. Dokumen belum dinilai dianggap tidak relevan. Lexical maksimal 50 potongan; hybrid menilai 100 kandidat dan mengembalikan maksimal 40 matches. Holdout harus dipisahkan dari tuning. Periksa retrieval fallback saat penyedia AI gagal.");
    }
}
