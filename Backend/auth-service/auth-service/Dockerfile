# Stage 1: Build with Maven
FROM eclipse-temurin:25-jdk-jammy AS builder
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN apt-get update && apt-get install -y maven && mvn clean package -DskipTests

# Stage 2: Run lightweight JRE only
FROM eclipse-temurin:25-jre-jammy
WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
