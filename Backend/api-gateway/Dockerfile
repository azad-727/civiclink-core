# Use an official OpenJDK runtime as a parent image
FROM eclipse-temurin:21-jdk-jammy

# Set the working directory
WORKDIR /app

# Copy the jar file from your target folder
# Note: Ensure you have built your jar first using 'mvn clean package'
COPY target/*.jar app.jar

# Expose the port your Java app runs on
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]