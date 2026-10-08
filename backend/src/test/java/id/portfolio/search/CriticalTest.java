package id.portfolio.search;

import id.portfolio.search.auth.AuthService;
import id.portfolio.search.assistant.CompletionDecoder;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import id.portfolio.search.documents.DocumentService;
import id.portfolio.search.evaluation.EvaluationService;
import id.portfolio.search.retrieval.SearchService;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class CriticalTest {
    @Test void routerSupportsJsonAndServerSentEvents() throws Exception {
        var json=new ObjectMapper();
        String normal="{\"choices\":[{\"message\":{\"content\":\"jawaban\"}}]}";
        assertEquals("jawaban",CompletionDecoder.read(new ByteArrayInputStream(normal.getBytes(StandardCharsets.UTF_8)),json));
        var compressed=new java.io.ByteArrayOutputStream();
        try(var gzip=new java.util.zip.GZIPOutputStream(compressed)) { gzip.write(normal.getBytes(StandardCharsets.UTF_8)); }
        assertEquals("jawaban",CompletionDecoder.read(new ByteArrayInputStream(compressed.toByteArray()),json));
        String sse="data: {\"choices\":[{\"delta\":{\"content\":\"jawa\"},\"finish_reason\":null}]}\n\n"
            +"data: {\"choices\":[{\"delta\":{\"content\":\"ban\"},\"finish_reason\":null}]}\n\n"
            +"data: {\"choices\":[{\"delta\":{},\"finish_reason\":\"stop\"}]}\n\n";
        assertEquals("jawaban",CompletionDecoder.read(new ByteArrayInputStream(sse.getBytes(StandardCharsets.UTF_8)),json));
        assertThrows(java.io.IOException.class,()->CompletionDecoder.read(new ByteArrayInputStream("data: {\"choices\":[{\"delta\":{\"content\":\"terpotong\"},\"finish_reason\":\"length\"}]}\n".getBytes(StandardCharsets.UTF_8)),json));
    }
    @Test void tokensCannotInjectTsquery() {
        assertEquals(List.of("backup","restore"),SearchService.tokens("bagaimana backup ' | ! restore?"));
        assertThrows(RuntimeException.class,()->SearchService.tokens("dan yang untuk"));
    }
    @Test void passwordsAndSourceValidation() {
        assertThrows(RuntimeException.class,()->AuthService.validatePassword("short"));
        assertThrows(RuntimeException.class,()->DocumentService.source("javascript:alert(1)"));
        assertThrows(RuntimeException.class,()->DocumentService.source("https://secret@example.com"));
        assertEquals("https://example.com/document",DocumentService.source("https://example.com/document"));
        assertEquals(64,AuthService.hash("session").length());
    }
    @Test void gradedRankingMetrics() {
        UUID a=UUID.randomUUID(),b=UUID.randomUUID(),c=UUID.randomUUID();
        Map<UUID,Integer> labels=Map.of(a,3,b,1);
        assertEquals(1,EvaluationService.ndcg(List.of(a,b),labels,5),1e-9);
        assertTrue(EvaluationService.ndcg(List.of(b,a),labels,5)<1);
        assertEquals(0,EvaluationService.ndcg(List.of(c),labels,5));
    }
}
