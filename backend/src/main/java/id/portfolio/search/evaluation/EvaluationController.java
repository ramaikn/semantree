package id.portfolio.search.evaluation;

import id.portfolio.search.auth.AccessGuard;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/evaluation")
public class EvaluationController {
    private final EvaluationService evaluation;
    public EvaluationController(EvaluationService evaluation) { this.evaluation=evaluation; }
    @GetMapping("/labels") public Object labels(HttpServletRequest r) { return evaluation.list(AccessGuard.actor(r)); }
    @PostMapping("/labels") public Object save(@RequestBody EvaluationService.Judgment in,HttpServletRequest r) { evaluation.save(AccessGuard.actor(r),in); return Map.of("ok",true); }
    @DeleteMapping("/labels/{id}") public Object delete(@PathVariable UUID id,HttpServletRequest r) { evaluation.delete(AccessGuard.actor(r),id); return Map.of("ok",true); }
    @PostMapping("/run") public Object run(@RequestParam(defaultValue="holdout") String split,@RequestParam(defaultValue="false") boolean hybrid,HttpServletRequest r) { return evaluation.run(AccessGuard.actor(r),split,hybrid); }
}
