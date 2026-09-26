package com.fesherprep.fesherprep_api.config;

import com.fesherprep.fesherprep_api.shared.dto.ApiErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
@RequiredArgsConstructor
public class AuthRateLimitFilter extends OncePerRequestFilter {
    private static final Map<String, LimitType> LIMITED_PATHS = Map.of(
            "/api/auth/login", LimitType.LOGIN,
            "/api/auth/register", LimitType.REGISTER,
            "/api/auth/refresh", LimitType.REFRESH
    );

    private final AuthRateLimitProperties properties;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final ConcurrentHashMap<String, RequestWindow> windows = new ConcurrentHashMap<>();
    private final AtomicLong cleanupCounter = new AtomicLong();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !properties.isEnabled()
                || !HttpMethod.POST.matches(request.getMethod())
                || !LIMITED_PATHS.containsKey(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        long now = clock.millis();
        long windowMillis = validatedWindowMillis();
        if ((cleanupCounter.incrementAndGet() & 255) == 0) {
            windows.entrySet().removeIf(entry -> entry.getValue().expired(now, windowMillis));
        }

        String key = request.getRequestURI() + ':' + request.getRemoteAddr();
        if (!windows.containsKey(key) && windows.size() >= Math.max(100, properties.getMaxClients())) {
            writeRateLimited(response, windowMillis);
            return;
        }

        RequestWindow window = windows.computeIfAbsent(key, ignored -> new RequestWindow(now));
        int limit = limitFor(LIMITED_PATHS.get(request.getRequestURI()));
        if (!window.tryAcquire(now, windowMillis, limit)) {
            writeRateLimited(response, windowMillis);
            return;
        }
        filterChain.doFilter(request, response);
    }

    private int limitFor(LimitType type) {
        return Math.max(1, switch (type) {
            case LOGIN -> properties.getLoginAttempts();
            case REGISTER -> properties.getRegisterAttempts();
            case REFRESH -> properties.getRefreshAttempts();
        });
    }

    private long validatedWindowMillis() {
        return Math.max(1_000L, properties.getWindow().toMillis());
    }

    private void writeRateLimited(HttpServletResponse response, long windowMillis) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader("Retry-After", Long.toString(Math.max(1, (windowMillis + 999) / 1_000)));
        objectMapper.writeValue(
                response.getOutputStream(),
                ApiErrorResponse.of(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "RATE_LIMITED",
                        "Too many authentication requests; try again later"
                )
        );
    }

    private enum LimitType {
        LOGIN, REGISTER, REFRESH
    }

    private static final class RequestWindow {
        private long startedAt;
        private int attempts;

        private RequestWindow(long startedAt) {
            this.startedAt = startedAt;
        }

        private synchronized boolean tryAcquire(long now, long windowMillis, int limit) {
            if (expired(now, windowMillis)) {
                startedAt = now;
                attempts = 0;
            }
            if (attempts >= limit) {
                return false;
            }
            attempts++;
            return true;
        }

        private synchronized boolean expired(long now, long windowMillis) {
            return now - startedAt >= windowMillis;
        }
    }
}
