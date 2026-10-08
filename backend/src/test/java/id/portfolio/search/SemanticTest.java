package id.portfolio.search;

import com.fasterxml.jackson.databind.ObjectMapper;
import id.portfolio.search.assistant.AiClient;
import id.portfolio.search.retrieval.*;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class SemanticTest {
    private SearchService.Hit hit() { return new SearchService.Hit(UUID.randomUUID(),UUID.randomUUID(),1,"Laporan Maret 2026","Keuangan","workspace","Tim", "Teks","Laba bersih Maret Rp97.500.000.",0,"","Simulasi",List.of(),"keyword"); }
    @Test void semanticHighlightsMustExistInSource() throws Exception {
        AiClient ai=mock(AiClient.class);
        when(ai.complete(anyString(),any(),anyInt())).thenReturn(new ObjectMapper().readTree("{\"matches\":[{\"index\":0,\"score\":0.9,\"highlights\":[\"Laba bersih\",\"pendapatan karangan\"]}]}"));
        var ranked=new SemanticRanker(ai).rank("untung",List.of(hit()));
        assertEquals(List.of("Laba bersih"),ranked.getFirst().highlights());
    }
    @Test void fabricatedCandidateIdsAreRejected() throws Exception {
        AiClient ai=mock(AiClient.class);
        when(ai.complete(anyString(),any(),anyInt())).thenReturn(new ObjectMapper().readTree("{\"matches\":[{\"index\":99,\"score\":0.9,\"highlights\":[]}]}"));
        assertThrows(IllegalArgumentException.class,()->new SemanticRanker(ai).rank("untung",List.of(hit())));
    }
}
