package com.fesherprep.fesherprep_api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "security.login-challenge")
public class LoginChallengeProperties {
    private boolean enabled = true;
    private int failureThreshold = 3;
    private Duration ttl = Duration.ofMinutes(3);
    private Duration failureRetention = Duration.ofMinutes(15);
    private int maxClients = 10_000;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getFailureThreshold() {
        return failureThreshold;
    }

    public void setFailureThreshold(int failureThreshold) {
        this.failureThreshold = failureThreshold;
    }

    public Duration getTtl() {
        return ttl;
    }

    public void setTtl(Duration ttl) {
        this.ttl = ttl;
    }

    public Duration getFailureRetention() {
        return failureRetention;
    }

    public void setFailureRetention(Duration failureRetention) {
        this.failureRetention = failureRetention;
    }

    public int getMaxClients() {
        return maxClients;
    }

    public void setMaxClients(int maxClients) {
        this.maxClients = maxClients;
    }
}
