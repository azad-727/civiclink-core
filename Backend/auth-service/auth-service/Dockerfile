# Corrected to Java 25 (pom.xml targets java.version 25 — the previous
# api-gateway Dockerfile used a 21 runtime, which throws
# UnsupportedClassVersionError against Java 25 bytecode).
FROM eclipse-temurin:25-jre-jammy

WORKDIR /app

# Build the jar first: .\mvnw clean package -DskipTests
COPY target/*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
