package com.fesherprep.fesherprep_api.config;

import com.fesherprep.fesherprep_api.shared.dto.ApiErrorResponse;
import com.fesherprep.fesherprep_api.user.domain.User;
import com.fesherprep.fesherprep_api.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CurrentUserSecurityFilter extends OncePerRequestFilter {
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof JwtAuthenticationToken jwtAuthentication)
                || !authentication.isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        Optional<User> user = currentUser(jwtAuthentication);
        if (user.isEmpty() || !user.get().isActive()) {
            SecurityContextHolder.clearContext();
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            objectMapper.writeValue(
                    response.getOutputStream(),
                    ApiErrorResponse.of(
                            HttpStatus.UNAUTHORIZED,
                            "SESSION_INVALIDATED",
                            "The account session is no longer valid"
                    )
            );
            return;
        }

        // The database owns the current authorization state. A role change must not
        // invalidate an otherwise valid session, but it must take effect immediately.
        JwtAuthenticationToken currentAuthentication = new JwtAuthenticationToken(
                jwtAuthentication.getToken(),
                java.util.List.of(new SimpleGrantedAuthority("ROLE_" + user.get().getRole().name())),
                jwtAuthentication.getName()
        );
        currentAuthentication.setDetails(jwtAuthentication.getDetails());
        SecurityContextHolder.getContext().setAuthentication(currentAuthentication);
        filterChain.doFilter(request, response);
    }

    private Optional<User> currentUser(JwtAuthenticationToken authentication) {
        try {
            return userRepository.findById(UUID.fromString(authentication.getName()));
        } catch (IllegalArgumentException exception) {
            return Optional.empty();
        }
    }
}
