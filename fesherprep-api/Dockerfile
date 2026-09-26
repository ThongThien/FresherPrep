# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

RUN groupadd --system fresherprep \
    && useradd --system --gid fresherprep --home-dir /app --shell /usr/sbin/nologin fresherprep \
    && chown fresherprep:fresherprep /app/app.jar

USER fresherprep

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
