package id.portfolio.search.retrieval;

import id.portfolio.search.auth.AccessGuard;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
public class SearchController {
    private final SearchService search;
    public SearchController(SearchService search) { this.search=search; }
    @GetMapping public Object query(@RequestParam String q,@RequestParam(defaultValue="hybrid") String method,@RequestParam(required=false) String category,@RequestParam(required=false) String visibility,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size,HttpServletRequest r) {
        return search.search(AccessGuard.actor(r),q,method,category,visibility,page,size);
    }
}
