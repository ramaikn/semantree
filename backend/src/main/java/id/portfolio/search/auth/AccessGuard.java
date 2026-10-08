package id.portfolio.search.auth;

import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.*;
import org.springframework.web.servlet.config.annotation.*;
import java.util.Set;

@Configuration
public class AccessGuard implements WebMvcConfigurer, HandlerInterceptor {
    private final AuthService auth;
    private final String origin;
    public AccessGuard(AuthService auth,@Value("${app.origin}") String origin) { this.auth=auth; this.origin=origin; }
    public static String token(HttpServletRequest request) {
        if(request.getCookies()!=null) for(var c:request.getCookies()) if(c.getName().equals("knowledge_session")) return c.getValue();
        return null;
    }
    public static Actor actor(HttpServletRequest request) { return (Actor)request.getAttribute("actor"); }
    @Override public void addInterceptors(InterceptorRegistry registry) { registry.addInterceptor(this).addPathPatterns("/api/**"); }
    @Override public boolean preHandle(HttpServletRequest req,HttpServletResponse res,Object handler) throws Exception {
        res.setHeader("X-Content-Type-Options","nosniff"); res.setHeader("Cache-Control","no-store");
        if(!Set.of("GET","HEAD","OPTIONS").contains(req.getMethod()) && !origin.equals(req.getHeader("Origin"))) return deny(res,403,"Asal permintaan tidak diizinkan.");
        if(req.getRequestURI().equals("/api/auth/login") || req.getRequestURI().equals("/api/health")) return true;
        Actor actor=auth.actor(token(req));
        if(actor==null) return deny(res,401,"Silakan masuk kembali.");
        req.setAttribute("actor",actor); return true;
    }
    private boolean deny(HttpServletResponse res,int status,String message) throws Exception { res.setStatus(status); res.setContentType("application/json;charset=UTF-8"); res.getWriter().write("{\"error\":\""+message+"\"}"); return false; }
}
