package id.portfolio.search.documents;

import id.portfolio.search.auth.AccessGuard;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api")
public class DocumentController {
    private final DocumentService docs;
    public DocumentController(DocumentService docs) { this.docs=docs; }
    @GetMapping("/documents") public Object list(HttpServletRequest r) { return docs.list(AccessGuard.actor(r)); }
    @GetMapping("/stats") public Object stats(HttpServletRequest r) { return docs.stats(AccessGuard.actor(r)); }
    @GetMapping("/runs") public Object runs(HttpServletRequest r) { return docs.runs(AccessGuard.actor(r)); }
    @GetMapping("/audit") public Object audit(HttpServletRequest r) { return docs.audit(AccessGuard.actor(r)); }
    @GetMapping("/documents/{id}") public Object detail(@PathVariable UUID id,@RequestParam(required=false) Integer version,HttpServletRequest r) { return docs.detail(AccessGuard.actor(r),id,version); }
    @PostMapping(value="/documents",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public Object upload(@RequestParam MultipartFile file,@RequestParam String title,@RequestParam(defaultValue="private") String visibility,@RequestParam(defaultValue="Umum") String category,@RequestParam(defaultValue="") String sourceUrl,@RequestParam(defaultValue="") String license,@RequestParam(required=false) UUID documentId,HttpServletRequest r) throws Exception {
        return docs.upload(AccessGuard.actor(r),documentId,title,visibility,category,sourceUrl,license,file.getOriginalFilename(),file.getBytes());
    }
    public record Metadata(String title,String visibility,String category) {}
    @PatchMapping("/documents/{id}") public Object update(@PathVariable UUID id,@RequestBody Metadata in,HttpServletRequest r) { docs.update(AccessGuard.actor(r),id,in.title(),in.visibility(),in.category()); return Map.of("ok",true); }
    @DeleteMapping("/documents/{id}") public Object delete(@PathVariable UUID id,HttpServletRequest r) { docs.delete(AccessGuard.actor(r),id); return Map.of("ok",true); }
    @GetMapping("/documents/{id}/download") public ResponseEntity<byte[]> download(@PathVariable UUID id,@RequestParam int version,HttpServletRequest r) {
        var file=docs.download(AccessGuard.actor(r),id,version);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM).header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.attachment().filename(file.filename(),StandardCharsets.UTF_8).build().toString()).body(file.bytes());
    }
}
