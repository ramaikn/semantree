package id.portfolio.search.auth;

import id.portfolio.search.api.Problem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.security.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService implements ApplicationRunner {
    private final JdbcTemplate db;
    private final TransactionTemplate tx;
    private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder(12);
    private final String bootstrapEmail, bootstrapPassword;
    private volatile boolean ready;
    private final ConcurrentHashMap<String,Attempt> attempts = new ConcurrentHashMap<>();
    private record Attempt(int count, long until) {}
    public AuthService(JdbcTemplate db, TransactionTemplate tx, @Value("${app.bootstrap-email}") String email, @Value("${app.bootstrap-password}") String password) {
        this.db=db; this.tx=tx; bootstrapEmail=email; bootstrapPassword=password;
    }
    @Override public void run(ApplicationArguments args) {
        if (db.queryForObject("SELECT count(*) FROM users", Integer.class) == 0) {
            validatePassword(bootstrapPassword);
            tx.executeWithoutResult(s -> {
                UUID workspace=UUID.randomUUID();
                db.update("INSERT INTO workspaces VALUES (?,?)",workspace,"Ruang Kerja Utama");
                db.update("INSERT INTO users(id,workspace_id,email,name,password_hash,role) VALUES (?,?,?,?,?,'admin')",UUID.randomUUID(),workspace,bootstrapEmail.toLowerCase(Locale.ROOT),"Administrator", passwords.encode(bootstrapPassword));
            });
        }
        db.update("DELETE FROM sessions WHERE expires_at < now()");
        db.update("UPDATE indexing_runs SET status='failed',message='Layanan berhenti saat pengindeksan. Upload kembali.',finished_at=now() WHERE status='processing'");
        ready=true;
    }
    public boolean ready() { return ready; }
    public static void validatePassword(String password) {
        if (password==null || password.length()<12 || password.getBytes(StandardCharsets.UTF_8).length>72) throw Problem.bad("Password harus 12 sampai 72 byte.");
    }
    public static String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
    public String login(String email,String password,String address) {
        long now=System.currentTimeMillis();
        attempts.entrySet().removeIf(e -> e.getValue().until<now);
        String key=address;
        Attempt attempt=attempts.get(key);
        if (attempt!=null && attempt.count>=8) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"Terlalu banyak percobaan. Coba setelah 15 menit.");
        if (email==null || password==null || email.length()>160 || password.length()>100) throw Problem.bad("Email atau password tidak valid.");
        var rows=db.queryForList("SELECT id,password_hash FROM users WHERE email=? AND active",email.trim().toLowerCase(Locale.ROOT));
        boolean ok=!rows.isEmpty() && passwords.matches(password,(String)rows.getFirst().get("password_hash"));
        if (!ok) {
            attempts.compute(key,(k,v)->new Attempt(v==null ? 1 : v.count+1,now+900_000));
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Email atau password salah.");
        }
        attempts.remove(key);
        byte[] bytes=new byte[32]; new SecureRandom().nextBytes(bytes);
        String token=HexFormat.of().formatHex(bytes);
        db.update("INSERT INTO sessions VALUES (?,?,now()+interval '8 hours')",hash(token),rows.getFirst().get("id"));
        return token;
    }
    public Actor actor(String token) {
        if (token==null || !token.matches("[a-f0-9]{64}")) return null;
        var result=db.query("SELECT u.*,w.name workspace FROM sessions s JOIN users u ON u.id=s.user_id JOIN workspaces w ON w.id=u.workspace_id WHERE s.token_hash=? AND s.expires_at>now() AND u.active",(r,n)->new Actor(r.getObject("id",UUID.class),r.getObject("workspace_id",UUID.class),r.getString("email"),r.getString("name"),r.getString("role"),r.getString("workspace")),hash(token));
        return result.isEmpty()?null:result.getFirst();
    }
    public void logout(String token) { if(token!=null) db.update("DELETE FROM sessions WHERE token_hash=?",hash(token)); }
    public void admin(Actor actor) { if (!actor.admin()) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Hanya administrator yang dapat mengakses fitur ini."); }
    public List<Map<String,Object>> users(Actor actor) { admin(actor); return db.queryForList("SELECT id,email,name,role,active,created_at FROM users WHERE workspace_id=? ORDER BY name",actor.workspaceId()); }
    public void create(Actor actor, String email,String name,String password,String role, String workspaceName) {
        admin(actor); validatePassword(password);
        if(email==null || !email.matches("[^\\s@]{1,80}@[^\\s@]{1,80}") || name==null || name.isBlank() || name.length()>100 || !Set.of("member","admin").contains(role)) throw Problem.bad("Data pengguna tidak valid.");
        tx.executeWithoutResult(s->{
            UUID workspace=actor.workspaceId();
            if(workspaceName!=null && !workspaceName.isBlank()) {
                if(workspaceName.length()>100) throw Problem.bad("Nama ruang terlalu panjang.");
                workspace=UUID.randomUUID(); db.update("INSERT INTO workspaces VALUES (?,?)",workspace,workspaceName.trim());
            }
            if(db.queryForObject("SELECT count(*) FROM users WHERE email=?",Integer.class,email.toLowerCase(Locale.ROOT))>0) throw Problem.bad("Email sudah digunakan.");
            db.update("INSERT INTO users(id,workspace_id,email,name,password_hash,role) VALUES (?,?,?,?,?,?)",UUID.randomUUID(),workspace,email.toLowerCase(Locale.ROOT),name.trim(),passwords.encode(password),role);
            audit(actor,"user.create",email);
        });
    }
    public void deactivate(Actor actor,UUID id) {
        admin(actor); if(actor.id().equals(id)) throw Problem.bad("Tidak dapat menonaktifkan akun sendiri.");
        tx.executeWithoutResult(s->{
            if(db.update("UPDATE users SET active=false WHERE id=? AND workspace_id=?",id,actor.workspaceId())==0) throw Problem.missing();
            db.update("DELETE FROM sessions WHERE user_id=?",id); audit(actor,"user.deactivate",id.toString());
        });
    }
    public void audit(Actor a,String action,String target) { db.update("INSERT INTO audit_events(workspace_id,user_id,action,target) VALUES (?,?,?,?)",a.workspaceId(),a.id(),action,target); }
}
