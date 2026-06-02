# =============================================================================
# Synapse Backend — Multi-stage Dockerfile
# =============================================================================

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Cache dependencies first (only re-runs when pom.xml changes)
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -q

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Non-root user for security
RUN addgroup -S synapse && adduser -S synapse -G synapse

# Copy built jar
COPY --from=builder /build/target/*.jar app.jar

# Change ownership
RUN chown synapse:synapse app.jar
USER synapse

# Spring Boot default port
EXPOSE 8080

# Enable virtual threads (Java 21 bonus)
ENV JAVA_OPTS="-Xms256m -Xmx512m -Dspring.threads.virtual.enabled=true"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]