# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre

WORKDIR /app

# The Java knowledge challenge is built into the application; no external
# CAPTCHA binary or runtime download is required.
ENV LOGIN_CHALLENGE_ENABLED=true \
    LOGIN_CHALLENGE_FAILURE_THRESHOLD=3 \
    LOGIN_CHALLENGE_TTL=PT3M

COPY --from=build /app/target/*.jar app.jar

RUN groupadd --system fresherprep \
    && useradd --system --gid fresherprep --home-dir /app --shell /usr/sbin/nologin fresherprep \
    && chown fresherprep:fresherprep /app/app.jar

USER fresherprep

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
