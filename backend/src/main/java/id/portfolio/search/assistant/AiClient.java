package id.portfolio.search.assistant;

import com.fasterxml.jackson.databind.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.Semaphore;

/** Satu jalur komunikasi dan batas konkurensi untuk pencarian maupun jawaban. */
@Service
public class AiClient {
    private final ObjectMapper json;
    private final String url,key,model;
    private final Semaphore slots=new Semaphore(2);
    private final HttpClient client=HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1)
        .connectTimeout(Duration.ofSeconds(10)).followRedirects(HttpClient.Redirect.NEVER).build();
    public AiClient(ObjectMapper json,@Value("${app.ai-url}") String url,@Value("${app.ai-key}") String key,@Value("${app.ai-model}") String model) {
        this.json=json; this.url=url; this.key=key; this.model=model;
    }
    public boolean configured() { return !key.isBlank(); }
    public String model() { return model; }
    public JsonNode complete(String instruction,Object data,int maxTokens) {
        if(!configured()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"API AI belum dikonfigurasi.");
        if(!slots.tryAcquire()) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"AI sedang memproses dua permintaan. Coba sebentar lagi.");
        try {
            var body=Map.of("model",model,"stream",false,"temperature",0,"max_tokens",maxTokens,
                "messages",List.of(Map.of("role","system","content",instruction),Map.of("role","user","content",json.writeValueAsString(data))));
            var request=HttpRequest.newBuilder(URI.create(url.replaceAll("/$","")+"/chat/completions"))
                .timeout(Duration.ofSeconds(90)).header("Authorization","Bearer "+key)
                .header("Content-Type","application/json").header("Accept-Encoding","identity")
                .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body))).build();
            var response=client.send(request,HttpResponse.BodyHandlers.ofInputStream());
            String content;
            try(var stream=response.body()) {
                if(response.statusCode()!=200) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Penyedia AI menolak permintaan (HTTP "+response.statusCode()+").");
                content=CompletionDecoder.read(stream,json);
            }
            if(content.startsWith("```")) content=content.replaceFirst("^```(?:json)?\\s*","").replaceFirst("\\s*```$","");
            JsonNode result=json.readTree(content);
            if(result==null || !result.isObject()) throw new IllegalArgumentException("Invalid JSON object");
            return result;
        } catch(ResponseStatusException ex) { throw ex; }
        catch(Exception ex) {
            org.slf4j.LoggerFactory.getLogger(AiClient.class).warn("AI gagal: {}",ex.getClass().getSimpleName());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Respons AI tidak tersedia atau tidak valid. Coba kembali, tidak ada jawaban buatan pengganti.");
        } finally { slots.release(); }
    }
}
