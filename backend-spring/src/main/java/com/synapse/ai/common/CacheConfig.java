package com.synapse.ai.common;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();

        manager.registerCustomCache("stats",
                Caffeine.newBuilder().maximumSize(1)
                        .expireAfterWrite(30, TimeUnit.SECONDS).build());

        manager.registerCustomCache("heatmap",
                Caffeine.newBuilder().maximumSize(1)
                        .expireAfterWrite(60, TimeUnit.SECONDS).build());

        manager.registerCustomCache("markets",
                Caffeine.newBuilder().maximumSize(200)
                        .expireAfterWrite(60, TimeUnit.SECONDS).build());

        manager.registerCustomCache("trending",
                Caffeine.newBuilder().maximumSize(1)
                        .expireAfterWrite(60, TimeUnit.SECONDS).build());

        manager.registerCustomCache("signals",
                Caffeine.newBuilder().maximumSize(1)
                        .expireAfterWrite(30, TimeUnit.SECONDS).build());

        manager.registerCustomCache("trades",
                Caffeine.newBuilder().maximumSize(20)
                        .expireAfterWrite(15, TimeUnit.SECONDS).build());

        manager.registerCustomCache("orderbook",
                Caffeine.newBuilder().maximumSize(50)
                        .expireAfterWrite(10, TimeUnit.SECONDS).build());

        manager.registerCustomCache("history",
                Caffeine.newBuilder().maximumSize(200)
                        .expireAfterWrite(120, TimeUnit.SECONDS).build());

        return manager;
    }
}