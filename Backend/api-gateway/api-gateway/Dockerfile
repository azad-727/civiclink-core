# Use an official OpenJDK runtime as a parent image
# Corrected to Java 25 (pom.xml targets java.version 25 — the previous
# "21-jdk-jammy" runtime threw UnsupportedClassVersionError against
# Java 25 bytecode: class file version 69 vs the runtime's max of 65).
FROM eclipse-temurin:25-jre-jammy

# Set the working directory
WORKDIR /app

# Copy the jar file from your target folder
# Note: Ensure you have built your jar first using '.\mvnw clean package -DskipTests'
COPY target/*.jar app.jar

# Expose the port your Java app runs on
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
