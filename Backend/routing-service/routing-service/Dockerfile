FROM eclipse-temurin:25-jre-jammy

WORKDIR /app

# Build the jar first: .\mvnw clean package -DskipTests
COPY target/*.jar app.jar

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]
