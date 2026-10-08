package id.portfolio.search.assistant;

import id.portfolio.search.auth.AccessGuard;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {
    private final AssistantService ai;
    public AssistantController(AssistantService ai) { this.ai=ai; }
    public record Question(String question,String category,String visibility) {}
    @GetMapping("/status") public Object status() { return ai.status(); }
    @PostMapping public Object answer(@RequestBody Question in,HttpServletRequest r) { return ai.answer(AccessGuard.actor(r),in.question(),in.category(),in.visibility()); }
}
