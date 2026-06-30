FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY services/auth-service/pom.xml services/auth-service/
COPY services/tracking-service/pom.xml services/tracking-service/
COPY services/api-gateway/pom.xml services/api-gateway/
COPY . .
RUN mvn -q package -DskipTests -pl services/api-gateway -am

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/services/api-gateway/target/api-gateway-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
