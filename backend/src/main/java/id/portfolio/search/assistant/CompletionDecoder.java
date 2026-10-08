package id.portfolio.search.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.*;
import java.nio.charset.StandardCharsets;

/** 9router dapat mengirim SSE meskipun client meminta respons non-stream. */
public final class CompletionDecoder {
    private CompletionDecoder() {}
    public static String read(InputStream stream,ObjectMapper json) throws IOException {
        var probe=new PushbackInputStream(stream,2);
        byte[] prefix=probe.readNBytes(2); probe.unread(prefix);
        InputStream decoded=prefix.length==2 && (prefix[0]&255)==31 && (prefix[1]&255)==139 ? new java.util.zip.GZIPInputStream(probe) : probe;
        var reader=new BufferedReader(new InputStreamReader(decoded,StandardCharsets.UTF_8));
        StringBuilder raw=new StringBuilder(),content=new StringBuilder();
        String line; boolean sse=false; int chars=0;
        while((line=reader.readLine())!=null) {
            chars+=line.length(); if(chars>262144) throw new IOException("Response too large");
            if(line.startsWith("data:")) {
                sse=true; String data=line.substring(5).trim();
                if(data.equals("[DONE]")) break;
                if(data.isEmpty()) continue;
                var event=json.readTree(data);
                if(event.has("error")) throw new IOException("Provider stream error");
                var choice=event.path("choices").path(0);
                content.append(choice.path("delta").path("content").asText(""));
                if(!choice.path("finish_reason").isNull() && !choice.path("finish_reason").isMissingNode()) {
                    if(!"stop".equals(choice.path("finish_reason").asText())) throw new IOException("Incomplete completion");
                    return content.toString().trim();
                }
            } else if(!sse) raw.append(line).append('\n');
        }
        if(sse) throw new IOException("Stream ended before completion");
        var root=json.readTree(raw.toString());
        if(root==null || root.has("error")) throw new IOException("Invalid provider response");
        return root.path("choices").path(0).path("message").path("content").asText().trim();
    }
}
