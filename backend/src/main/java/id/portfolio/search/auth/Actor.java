package id.portfolio.search.auth;

import java.util.UUID;
public record Actor(UUID id, UUID workspaceId, String email, String name, String role, String workspace) {
    public boolean admin() { return "admin".equals(role); }
}
