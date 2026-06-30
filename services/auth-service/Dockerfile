# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY services/auth-service/pom.xml services/auth-service/
COPY services/tracking-service/pom.xml services/tracking-service/
COPY services/api-gateway/pom.xml services/api-gateway/
RUN mvn -q dependency:go-offline -pl services/auth-service -am || true

COPY . .
RUN mvn -q package -DskipTests -pl services/auth-service -am

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/services/auth-service/target/auth-service-*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
