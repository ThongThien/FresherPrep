package com.fesherprep.fesherprep_api.config;

import com.fesherprep.fesherprep_api.knowledge.dto.KnowledgeNodeResponse;
import com.fesherprep.fesherprep_api.knowledge.dto.KnowledgeTreeNodeResponse;
import com.fesherprep.fesherprep_api.learningpath.dto.LearningPathDetailResponse;
import com.fesherprep.fesherprep_api.lesson.dto.LessonDetailResponse;
import com.fesherprep.fesherprep_api.lesson.dto.LessonSummaryResponse;
import com.fesherprep.fesherprep_api.pet.dto.PetConfigResponse;
import com.fesherprep.fesherprep_api.pet.dto.PetDefinitionResponse;
import com.fesherprep.fesherprep_api.quiz.dto.PublishedQuizResponse;
import com.fesherprep.fesherprep_api.shared.dto.AdminDashboardResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.JacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Configuration(proxyBeanMethods = false)
@EnableCaching
public class CacheConfiguration implements CachingConfigurer {

    @Bean
    public CacheManager cacheManager(
            RedisConnectionFactory connectionFactory,
            ObjectMapper objectMapper
    ) {
        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
                .disableCachingNullValues()
                .entryTtl(Duration.ofMinutes(10))
                .prefixCacheNameWith("fresherprep:");

        Map<String, RedisCacheConfiguration> configurations = Map.ofEntries(
                Map.entry(CacheNames.KNOWLEDGE_TREE,
                        typed(defaults, objectMapper, objectMapper.getTypeFactory()
                                .constructCollectionType(List.class, KnowledgeTreeNodeResponse.class))
                                .entryTtl(Duration.ofMinutes(20))),
                Map.entry(CacheNames.KNOWLEDGE_NODE,
                        typed(defaults, objectMapper, KnowledgeNodeResponse.class)
                                .entryTtl(Duration.ofMinutes(20))),
                Map.entry(CacheNames.PUBLISHED_KNOWLEDGE_NODES,
                        typed(defaults, objectMapper, objectMapper.getTypeFactory()
                                .constructCollectionType(List.class, KnowledgeNodeResponse.class))
                                .entryTtl(Duration.ofMinutes(20))),
                Map.entry(CacheNames.ADMIN_KNOWLEDGE_NODES,
                        typed(defaults, objectMapper, objectMapper.getTypeFactory()
                                .constructCollectionType(List.class, KnowledgeNodeResponse.class))
                                .entryTtl(Duration.ofMinutes(5))),
                Map.entry(CacheNames.LEARNING_PATH_DETAIL,
                        typed(defaults, objectMapper, LearningPathDetailResponse.class)
                                .entryTtl(Duration.ofMinutes(15))),
                Map.entry(CacheNames.LESSON_DETAIL,
                        typed(defaults, objectMapper, LessonDetailResponse.class)
                                .entryTtl(Duration.ofMinutes(20))),
                Map.entry(CacheNames.ADMIN_LESSON_TREE,
                        typed(defaults, objectMapper, objectMapper.getTypeFactory()
                                .constructCollectionType(List.class, LessonSummaryResponse.class))
                                .entryTtl(Duration.ofMinutes(5))),
                Map.entry(CacheNames.QUIZ_DETAIL,
                        typed(defaults, objectMapper, PublishedQuizResponse.class)
                                .entryTtl(Duration.ofMinutes(10))),
                Map.entry(CacheNames.QUIZ_CATALOG,
                        typed(defaults, objectMapper, objectMapper.getTypeFactory()
                                .constructCollectionType(List.class, PublishedQuizResponse.class))
                                .entryTtl(Duration.ofMinutes(10))),
                Map.entry(CacheNames.PET_CONFIGURATION,
                        typed(defaults, objectMapper, PetConfigResponse.class)
                                .entryTtl(Duration.ofMinutes(20))),
                Map.entry(CacheNames.PET_DEFINITIONS,
                        typed(defaults, objectMapper, objectMapper.getTypeFactory()
                                .constructCollectionType(List.class, PetDefinitionResponse.class))
                                .entryTtl(Duration.ofMinutes(20))),
                Map.entry(CacheNames.ADMIN_DASHBOARD,
                        typed(defaults, objectMapper, AdminDashboardResponse.class)
                                .entryTtl(Duration.ofMinutes(1)))
        );

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaults)
                .withInitialCacheConfigurations(configurations)
                .transactionAware()
                .build();
    }

    private static RedisCacheConfiguration typed(
            RedisCacheConfiguration base,
            ObjectMapper objectMapper,
            Class<?> type
    ) {
        return typed(base, objectMapper, objectMapper.getTypeFactory().constructType(type));
    }

    private static RedisCacheConfiguration typed(
            RedisCacheConfiguration base,
            ObjectMapper objectMapper,
            JavaType type
    ) {
        JacksonJsonRedisSerializer<Object> serializer =
                new JacksonJsonRedisSerializer<>(objectMapper, type);
        return base.serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(serializer)
        );
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Redis cache GET failed; using PostgreSQL. cache={}, key={}, cause={}",
                        cache.getName(), key, exception.getMessage());
                log.debug("Redis cache GET failure details", exception);
            }

            @Override
            public void handleCachePutError(
                    RuntimeException exception,
                    Cache cache,
                    Object key,
                    Object value
            ) {
                log.warn("Redis cache PUT failed; response remains uncached. cache={}, key={}, cause={}",
                        cache.getName(), key, exception.getMessage());
                log.debug("Redis cache PUT failure details", exception);
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.error("Redis cache EVICT failed. cache={}, key={}, cause={}",
                        cache.getName(), key, exception.getMessage());
                log.debug("Redis cache EVICT failure details", exception);
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.error("Redis cache CLEAR failed. cache={}, cause={}",
                        cache.getName(), exception.getMessage());
                log.debug("Redis cache CLEAR failure details", exception);
            }
        };
    }
}
