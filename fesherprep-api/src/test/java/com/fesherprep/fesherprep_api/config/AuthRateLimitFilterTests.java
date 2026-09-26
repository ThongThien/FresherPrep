package com.fesherprep.fesherprep_api.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import tools.jackson.databind.ObjectMapper;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AuthRateLimitFilterTests {

    @Test
    void rejectsRequestsAfterEndpointAndClientLimit() throws Exception {
        AuthRateLimitProperties properties = new AuthRateLimitProperties();
        properties.setLoginAttempts(2);
        AuthRateLimitFilter filter = new AuthRateLimitFilter(
                properties,
                new ObjectMapper(),
                Clock.fixed(Instant.parse("2026-09-26T00:00:00Z"), ZoneOffset.UTC)
        );
        AtomicInteger accepted = new AtomicInteger();

        assertEquals(200, invoke(filter, accepted).getStatus());
        assertEquals(200, invoke(filter, accepted).getStatus());
        MockHttpServletResponse rejected = invoke(filter, accepted);

        assertEquals(2, accepted.get());
        assertEquals(429, rejected.getStatus());
        assertEquals("60", rejected.getHeader("Retry-After"));
        org.junit.jupiter.api.Assertions.assertTrue(rejected.getContentAsString().contains("RATE_LIMITED"));
    }

    private static MockHttpServletResponse invoke(
            AuthRateLimitFilter filter,
            AtomicInteger accepted
    ) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr("192.0.2.10");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, (ignoredRequest, ignoredResponse) -> accepted.incrementAndGet());
        return response;
    }
}
