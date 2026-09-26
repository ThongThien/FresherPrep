package com.fesherprep.fesherprep_api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "security.auth-rate-limit")
public class AuthRateLimitProperties {
    private boolean enabled = true;
    private Duration window = Duration.ofMinutes(1);
    private int loginAttempts = 10;
    private int registerAttempts = 5;
    private int refreshAttempts = 30;
    private int maxClients = 10_000;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Duration getWindow() {
        return window;
    }

    public void setWindow(Duration window) {
        this.window = window;
    }

    public int getLoginAttempts() {
        return loginAttempts;
    }

    public void setLoginAttempts(int loginAttempts) {
        this.loginAttempts = loginAttempts;
    }

    public int getRegisterAttempts() {
        return registerAttempts;
    }

    public void setRegisterAttempts(int registerAttempts) {
        this.registerAttempts = registerAttempts;
    }

    public int getRefreshAttempts() {
        return refreshAttempts;
    }

    public void setRefreshAttempts(int refreshAttempts) {
        this.refreshAttempts = refreshAttempts;
    }

    public int getMaxClients() {
        return maxClients;
    }

    public void setMaxClients(int maxClients) {
        this.maxClients = maxClients;
    }
}
