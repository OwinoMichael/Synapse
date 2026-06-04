package com.synapse.ai.common.api;

import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Stub controller for signals until the signals feature is built.
 * Returns empty list so the frontend doesn't 404.
 * Replace with real SignalRepository queries once signals feature is done.
 */
@RestController
@RequestMapping("/api/signals")
@CrossOrigin(origins = {"http://localhost:3000", "https://mikeowino.cloud"})
public class SignalsController {

    @GetMapping
    public List<Map<String, Object>> getSignals(
            @RequestParam(required = false, defaultValue = "true") boolean active
    ) {
        // TODO: replace with real signal data from signals feature
        return List.of();
    }
}