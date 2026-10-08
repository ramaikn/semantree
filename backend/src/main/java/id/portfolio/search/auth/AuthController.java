package id.portfolio.search.auth;

import jakarta.servlet.http.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth) { this.auth=auth; }
    public record Login(String email,String password) {}
    public record UserInput(String email,String name,String password,String role,String newWorkspace) {}
    @GetMapping("/health") public ResponseEntity<?> health() {
        return ResponseEntity.status(auth.ready()?HttpStatus.OK:HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of("status",auth.ready()?"ok":"starting"));
    }
    @PostMapping("/auth/login") public ResponseEntity<?> login(@RequestBody Login in,HttpServletRequest req) {
        String token=auth.login(in.email(),in.password(),req.getRemoteAddr());
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE,ResponseCookie.from("knowledge_session",token).httpOnly(true).sameSite("Strict").path("/api").maxAge(28800).build().toString()).body(auth.actor(token));
    }
    @GetMapping("/auth/me") public Actor me(HttpServletRequest req) { return AccessGuard.actor(req); }
    @PostMapping("/auth/logout") public ResponseEntity<?> logout(HttpServletRequest req) {
        auth.logout(AccessGuard.token(req)); return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE,ResponseCookie.from("knowledge_session","").httpOnly(true).sameSite("Strict").path("/api").maxAge(0).build().toString()).body(Map.of("ok",true));
    }
    @GetMapping("/users") public Object users(HttpServletRequest req) { return auth.users(AccessGuard.actor(req)); }
    @PostMapping("/users") public Object create(@RequestBody UserInput in,HttpServletRequest req) { auth.create(AccessGuard.actor(req),in.email(),in.name(),in.password(),in.role(),in.newWorkspace()); return Map.of("ok",true); }
    @DeleteMapping("/users/{id}") public Object deactivate(@PathVariable UUID id,HttpServletRequest req) { auth.deactivate(AccessGuard.actor(req),id); return Map.of("ok",true); }
}
