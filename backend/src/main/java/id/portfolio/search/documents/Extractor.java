package id.portfolio.search.documents;

import com.fasterxml.jackson.databind.ObjectMapper;
import id.portfolio.search.api.Problem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.Semaphore;

@Component
public class Extractor {
    public record Chunk(String content,String location) {}
    public record Result(List<Chunk> chunks,int textLength) {}
    private final Path script;
    private final ObjectMapper json;
    private final Semaphore slots = new Semaphore(2);
    public Extractor(@Value("${app.extractor}") String script,ObjectMapper json) { this.script=Path.of(script).toAbsolutePath(); this.json=json; }
    public Result extract(byte[] data,String extension) {
        if(!slots.tryAcquire()) throw Problem.bad("Pengindeksan sedang penuh. Tunggu sebentar lalu coba lagi.");
        Path file=null, output=null, errors=null;
        Process process=null;
        try {
            file=Files.createTempFile("knowledge-",extension); output=Files.createTempFile("extract-",".json"); errors=Files.createTempFile("extract-",".log");
            Files.write(file,data);
            var builder=new ProcessBuilder("uv","run","--offline","--project",script.getParent().toString(),script.toString(),file.toString(),extension);
            builder.environment().put("PYTHONIOENCODING","utf-8");
            process=builder.redirectOutput(output.toFile()).redirectError(errors.toFile()).start();
            if(!process.waitFor(60,TimeUnit.SECONDS)) {
                process.descendants().forEach(ProcessHandle::destroyForcibly); process.destroyForcibly();
                throw Problem.bad("Ekstraksi melewati batas 60 detik.");
            }
            if(Files.size(output)>8_000_000) throw Problem.bad("Hasil ekstraksi terlalu besar.");
            var node=json.readTree(Files.readString(output));
            if(node.has("error")) throw Problem.bad(node.get("error").asText());
            if(process.exitValue()!=0) throw Problem.bad("Layanan ekstraksi gagal. Periksa instalasi uv.");
            Result result=json.treeToValue(node,Result.class);
            if(result.chunks()==null || result.chunks().isEmpty() || result.chunks().size()>3000 || result.textLength()>1_500_000) throw Problem.bad("Hasil ekstraksi tidak valid.");
            return result;
        } catch(org.springframework.web.server.ResponseStatusException ex) { throw ex; }
        catch(Exception ex) { throw Problem.bad("Ekstraksi gagal. Pastikan uv dan dependensi pipeline tersedia."); }
        finally {
            if(process!=null && process.isAlive()) { process.descendants().forEach(ProcessHandle::destroyForcibly); process.destroyForcibly(); }
            for(Path path:new Path[]{file,output,errors}) if(path!=null) try { Files.deleteIfExists(path); } catch(Exception ignored) {}
            slots.release();
        }
    }
}
